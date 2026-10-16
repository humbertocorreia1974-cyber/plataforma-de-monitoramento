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
  const clientId = searchParams.get("clientId") || undefined;

  const isAdmin = session.user.role === "admin";
  const isCliente = session.user.role === "cliente";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (isCliente) where.clientId = session.user.clientId ?? "__none__";
  if (!isAdmin && !isCliente) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      subscriptions: { select: { id: true, plan: true, status: true, monthlyValue: true, sitesCount: true, camerasCount: true } },
    },
  });

  return NextResponse.json({ contracts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Somente admin" }, { status: 403 });

  const body = await request.json();
  const { code, clientId, siteId, title, description, monthlyValue, billingCycle, startDate, endDate } = body;

  if (!code || !clientId || !title || monthlyValue == null || !startDate) {
    return NextResponse.json({ error: "Campos obrigatórios: code, clientId, title, monthlyValue, startDate" }, { status: 400 });
  }

  const contract = await prisma.contract.create({
    data: {
      code,
      clientId,
      siteId: siteId || null,
      title,
      description: description || null,
      monthlyValue,
      billingCycle: billingCycle || "mensal",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: "ativo",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "create",
      entityType: "Contract",
      entityId: contract.id,
      after: { code: contract.code, monthlyValue: String(contract.monthlyValue) },
    },
  });

  return NextResponse.json({ contract }, { status: 201 });
}
