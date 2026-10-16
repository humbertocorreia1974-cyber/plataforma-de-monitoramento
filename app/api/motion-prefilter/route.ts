import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "operador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const rules = await prisma.detectionRule.findMany({
    include: { camera: { select: { id: true, name: true, siteId: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "operador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const cameraId = body?.cameraId as string | undefined;
  const sensitivity = Number(body?.sensitivity);
  const cooldownSeconds = Number(body?.cooldownSeconds);

  if (!cameraId || Number.isNaN(sensitivity) || Number.isNaN(cooldownSeconds)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (sensitivity < 0.05 || sensitivity > 0.95) {
    return NextResponse.json({ error: "Sensibilidade fora do range" }, { status: 400 });
  }
  if (cooldownSeconds < 5 || cooldownSeconds > 600) {
    return NextResponse.json({ error: "Cooldown fora do range" }, { status: 400 });
  }

  const camera = await prisma.camera.findUnique({ where: { id: cameraId } });
  if (!camera) {
    return NextResponse.json({ error: "Câmera não encontrada" }, { status: 404 });
  }

  const existing = await prisma.detectionRule.findFirst({
    where: { cameraId, name: "Pré-filtro de movimento" },
  });

  const rule = existing
    ? await prisma.detectionRule.update({
        where: { id: existing.id },
        data: { sensitivity, cooldownSeconds, enabled: true },
      })
    : await prisma.detectionRule.create({
        data: {
          cameraId,
          name: "Pré-filtro de movimento",
          enabled: true,
          sensitivity,
          cooldownSeconds,
          objectClasses: "pessoa,veiculo,objeto",
          minConfidence: 0.5,
        },
      });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role ?? null,
      action: existing ? "update" : "create",
      entityType: "DetectionRule",
      entityId: rule.id,
      after: { sensitivity, cooldownSeconds, cameraId },
    },
  });

  return NextResponse.json({ rule });
}
