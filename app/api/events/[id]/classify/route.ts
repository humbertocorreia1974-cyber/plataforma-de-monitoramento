import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowedSiteIds, audit, getSessionRole, jsonError, jsonOk, requireSession } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const __session = await getServerSession(authOptions as any);
  if (!(__session as any)?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const session = await requireSession();
    const role = (await getSessionRole())!;
    const allowed = await allowedSiteIds(session.user.id, role);
    const { classification } = await req.json();
    if (!["pessoa", "veiculo", "objeto", "desconhecido"].includes(classification)) {
      return jsonError("classificação inválida");
    }
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return jsonError("não encontrado", 404);
    if (allowed !== "all" && !allowed.includes(event.siteId)) return jsonError("sem acesso", 403);

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: {
        classification,
        status: "classificado",
        classifiedById: session.user.id,
        classifiedAt: new Date(),
      },
    });
    await audit({
      actorId: session.user.id,
      actorRole: role,
      action: "classify",
      entityType: "Event",
      entityId: event.id,
      before: { classification: event.classification },
      after: { classification },
      ip: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
      eventId: event.id,
    });
    return jsonOk({ event: updated });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return jsonError("não autenticado", 401);
    return jsonError(e?.message ?? "erro", 500);
  }
}
