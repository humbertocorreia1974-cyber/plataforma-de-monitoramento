import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["user", "operador", "cliente", "tecnico", "admin"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Somente admin" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { role } = body;

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
  }

  const before = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!before) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "update",
      entityType: "User",
      entityId: id,
      before: { role: before.role },
      after: { role: user.role },
    },
  });

  return NextResponse.json({ user });
}
