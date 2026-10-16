import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function canAccessCamera(userId: string, role: string, cameraId: string) {
  if (role === "admin") return true;
  const cam = await prisma.camera.findUnique({
    where: { id: cameraId },
    select: { siteId: true },
  });
  if (!cam) return false;
  const link = await prisma.siteOperator.findUnique({
    where: { siteId_userId: { siteId: cam.siteId, userId } },
  });
  return !!link;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const role = (session.user as { role?: string }).role ?? "user";
  if (role !== "admin" && role !== "operador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  const ok = await canAccessCamera(session.user.id, role, id);
  if (!ok) {
    return NextResponse.json({ error: "Câmera fora do seu escopo" }, { status: 403 });
  }

  const camera = await prisma.camera.findUnique({ where: { id } });
  if (!camera) {
    return NextResponse.json({ error: "Câmera não encontrada" }, { status: 404 });
  }

  // Health-check real: tenta HEAD no RTSP/ONVIF (best-effort) e mede latência.
  const started = Date.now();
  let status: "online" | "offline" | "degradada" = "offline";
  let message = "Sem URL configurada";
  const target = camera.onvifUrl || camera.rtspUrl;
  if (target) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(target, { method: "GET", signal: controller.signal });
      clearTimeout(t);
      const latency = Date.now() - started;
      if (res.ok || res.status === 401 || res.status === 403) {
        status = latency > 1500 ? "degradada" : "online";
        message = `Resposta HTTP ${res.status} em ${latency}ms`;
      } else {
        status = "degradada";
        message = `HTTP ${res.status}`;
      }
    } catch (err) {
      status = "offline";
      message = err instanceof Error ? err.message : "Falha de rede";
    }
  }
  const latencyMs = Date.now() - started;

  const health = await prisma.cameraHealthCheck.create({
    data: { cameraId: id, status, latencyMs, message },
  });

  await prisma.camera.update({
    where: { id },
    data: {
      status,
      healthStatus: status === "online" ? "ok" : status === "degradada" ? "warn" : "fail",
      healthCheckedAt: new Date(),
      lastSeenAt: status === "online" ? new Date() : camera.lastSeenAt,
      lastLatencyMs: latencyMs,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role,
      action: "update",
      entityType: "Camera",
      entityId: id,
      after: { health: status, latencyMs },
    },
  });

  // Alerta se caiu
  if (status === "offline") {
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "camera_offline",
        title: `Câmera offline: ${camera.name}`,
        message: message,
        link: `/cameras/${id}`,
      },
    });
  }

  return NextResponse.json({ ok: true, health });
}
