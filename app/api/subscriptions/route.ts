import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const plan = searchParams.get("plan") || undefined;

  const isAdmin = session.user.role === "admin";
  const isCliente = session.user.role === "cliente";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (plan) where.plan = plan;
  if (isCliente) where.clientId = session.user.clientId ?? "__none__";
  if (!isAdmin && !isCliente) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      contract: { select: { id: true, code: true, title: true } },
    },
  });

  return NextResponse.json({ subscriptions });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Somente admin" }, { status: 403 });

  const body = await request.json();
  const { clientId, contractId, plan, monthlyValue, sitesCount, camerasCount } = body;

  if (!clientId || !plan || monthlyValue == null) {
    return NextResponse.json({ error: "Campos obrigatórios: clientId, plan, monthlyValue" }, { status: 400 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      clientId,
      contractId: contractId || null,
      plan,
      status: "ativa",
      monthlyValue,
      sitesCount: sitesCount ?? 0,
      camerasCount: camerasCount ?? 0,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "create",
      entityType: "Subscription",
      entityId: subscription.id,
      after: { plan: subscription.plan, monthlyValue: String(subscription.monthlyValue) },
    },
  });

  return NextResponse.json({ subscription }, { status: 201 });
}
