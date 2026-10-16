import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowedSiteIds, getSessionRole, jsonError, jsonOk, requireSession } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const __session = await getServerSession(authOptions as any);
  if (!(__session as any)?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const session = await requireSession();
    const role = (await getSessionRole())!;
    const allowed = await allowedSiteIds(session.user.id, role);
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        site: { include: { client: true } },
        camera: true,
        sensor: true,
        detectionRule: true,
        seenBy: { select: { id: true, name: true } },
        classifiedBy: { select: { id: true, name: true } },
        discardedBy: { select: { id: true, name: true } },
        incident: true,
        auditLogs: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
      },
    });
    if (!event) return jsonError("não encontrado", 404);
    if (allowed !== "all" && !allowed.includes(event.siteId)) return jsonError("sem acesso", 403);
    return jsonOk({ event });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return jsonError("não autenticado", 401);
    return jsonError(e?.message ?? "erro", 500);
  }
}
