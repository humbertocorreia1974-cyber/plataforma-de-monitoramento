import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowedSiteIds, getSessionRole, jsonError, jsonOk, requireSession } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const __session = await getServerSession(authOptions as any);
  if (!(__session as any)?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const session = await requireSession();
    const role = (await getSessionRole())!;
    const allowed = await allowedSiteIds(session.user.id, role);
    const url = new URL(req.url);
    const siteId = url.searchParams.get("siteId") ?? undefined;
    const cameraId = url.searchParams.get("cameraId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const where: any = {};
    if (allowed !== "all") where.siteId = { in: allowed };
    if (siteId) where.siteId = siteId;
    if (cameraId) where.cameraId = cameraId;
    if (status) where.status = status;
    if (from || to) {
      where.occurredAt = {};
      if (from) where.occurredAt.gte = new Date(from);
      if (to) where.occurredAt.lte = new Date(to);
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 100,
      include: {
        site: { select: { id: true, name: true, client: { select: { name: true } } } },
        camera: { select: { id: true, name: true } },
      },
    });
    return jsonOk({ events });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return jsonError("não autenticado", 401);
    return jsonError(e?.message ?? "erro", 500);
  }
}
