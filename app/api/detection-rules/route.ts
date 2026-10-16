import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "user";

  const url = new URL(request.url);
  const cameraId = url.searchParams.get("cameraId") ?? undefined;

  let where: Record<string, unknown> = {};
  if (cameraId) where.cameraId = cameraId;

  if (role !== "admin") {
    const allowed = await prisma.siteOperator.findMany({
      where: { userId: session.user.id },
      select: { siteId: true },
    });
    const siteIds = allowed.map((a) => a.siteId);
    where = { ...where, camera: { siteId: { in: siteIds } } };
  }

  const rules = await prisma.detectionRule.findMany({
    where,
    include: { camera: { select: { id: true, name: true, site: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "user";
  if (role !== "admin" && role !== "operador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.cameraId || !body?.name) {
    return NextResponse.json({ error: "cameraId e name obrigatórios" }, { status: 400 });
  }

  const camera = await prisma.camera.findUnique({
    where: { id: body.cameraId },
    select: { siteId: true },
  });
  if (!camera) return NextResponse.json({ error: "Câmera não encontrada" }, { status: 404 });

  if (role !== "admin") {
    const link = await prisma.siteOperator.findUnique({
      where: { siteId_userId: { siteId: camera.siteId, userId: session.user.id } },
    });
    if (!link) return NextResponse.json({ error: "Fora do escopo" }, { status: 403 });
  }

  const rule = await prisma.detectionRule.create({
    data: {
      cameraId: body.cameraId,
      name: body.name,
      enabled: body.enabled ?? true,
      zone: body.zone ?? undefined,
      scheduleStart: body.scheduleStart ?? null,
      scheduleEnd: body.scheduleEnd ?? null,
      daysOfWeek: body.daysOfWeek ?? null,
      sensitivity: typeof body.sensitivity === "number" ? body.sensitivity : 0.5,
      objectClasses: body.objectClasses ?? null,
      minConfidence: typeof body.minConfidence === "number" ? body.minConfidence : 0.5,
      cooldownSeconds: typeof body.cooldownSeconds === "number" ? body.cooldownSeconds : 30,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role,
      action: "create",
      entityType: "DetectionRule",
      entityId: rule.id,
      after: { name: rule.name, cameraId: rule.cameraId },
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
