import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS = ["aberto", "em_analise", "resolvido", "arquivado"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role ?? "user";
  if (!session?.user?.id || !["admin", "operador"].includes(role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status ?? "");
  const assignedToId = body.assignedToId ? String(body.assignedToId) : null;
  const resolutionNotes = body.resolutionNotes ? String(body.resolutionNotes).trim() : null;

  if (!STATUS.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const incident = await prisma.incident.update({
    where: { id },
    data: {
      status,
      assignedToId,
      resolutionNotes,
      resolvedAt: status === "resolvido" ? new Date() : existing.resolvedAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role,
      action: "update_incident",
      entityType: "Incident",
      entityId: id,
      before: { status: existing.status, assignedToId: existing.assignedToId },
      after: { status, assignedToId, resolutionNotes },
      ip,
      userAgent,
      incidentId: id,
    },
  });

  return NextResponse.json({ ok: true, incident });
}
