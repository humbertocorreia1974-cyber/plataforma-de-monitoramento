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
  const before = await prisma.contract.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.title) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.monthlyValue != null) data.monthlyValue = body.monthlyValue;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

  const contract = await prisma.contract.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "update",
      entityType: "Contract",
      entityId: id,
      before: { status: before.status, monthlyValue: String(before.monthlyValue) },
      after: { status: contract.status, monthlyValue: String(contract.monthlyValue) },
    },
  });

  return NextResponse.json({ contract });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Somente admin" }, { status: 403 });

  const { id } = await params;
  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
