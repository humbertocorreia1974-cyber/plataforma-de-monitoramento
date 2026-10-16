import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Somente admin" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const before = await prisma.subscription.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.plan) data.plan = body.plan;
  if (body.monthlyValue != null) data.monthlyValue = body.monthlyValue;
  if (body.sitesCount != null) data.sitesCount = body.sitesCount;
  if (body.camerasCount != null) data.camerasCount = body.camerasCount;
  if (body.status === "cancelada") data.canceledAt = new Date();

  const subscription = await prisma.subscription.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "update",
      entityType: "Subscription",
      entityId: id,
      before: { status: before.status, plan: before.plan },
      after: { status: subscription.status, plan: subscription.plan },
    },
  });

  return NextResponse.json({ subscription });
}
