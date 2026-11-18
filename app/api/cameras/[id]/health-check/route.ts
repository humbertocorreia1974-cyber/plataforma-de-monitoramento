import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import net from "net";
import { lookup } from "dns/promises";
import { allowedSiteIds, siteAllowed } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h === "::1" || h === "0.0.0.0") return true;
  if (/^(fc|fd)[0-9a-f]{2}:/.test(h) || h.startsWith("fe80:")) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

async function hostIsPrivate(host: string): Promise<boolean> {
  if (isPrivateHost(host)) return true;
  try {
    const addrs = await lookup(host, { all: true });
    return addrs.some((a) => isPrivateHost(a.address));
  } catch {
    return false;
  }
}

function tcpProbe(host: string, port: number, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port });
    const timer = setTimeout(() => { sock.destroy(); reject(new Error("timeout")); }, ms);
    sock.once("connect", () => { clearTimeout(timer); sock.destroy(); resolve(); });
    sock.once("error", (e) => { clearTimeout(timer); reject(e); });
  });
}

async function canAccessCamera(userId: string, role: string, cameraId: string) {
  if (role === "admin") return true;
  const cam = await prisma.camera.findUnique({ where: { id: cameraId }, select: { siteId: true } });
  if (!cam) return false;
  const allowed = await allowedSiteIds(userId, role as any);
  return siteAllowed(allowed, cam.siteId);
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

  const started = Date.now();
  let status: "online" | "offline" | "degradada" = "offline";
  let message = "Sem URL configurada";
  const target = camera.onvifUrl || camera.rtspUrl;
  if (target) {
    let url: URL | null = null;
    try { url = new URL(target); } catch { url = null; }
    if (!url || !["rtsp:", "rtsps:", "http:", "https:"].includes(url.protocol)) {
      message = "URL da câmera inválida";
    } else if (await hostIsPrivate(url.hostname)) {
      // Câmera em rede privada: o servidor na nuvem não alcança. Não marcar offline por engano.
      return NextResponse.json({
        ok: false,
        skipped: true,
        message: "Câmera em rede privada: a nuvem não consegue testá-la. O status deve vir do gateway local.",
      });
    } else {
      try {
        if (url.protocol === "rtsp:" || url.protocol === "rtsps:") {
          await tcpProbe(url.hostname, Number(url.port) || 554, 4000);
          const latency = Date.now() - started;
          status = latency > 1500 ? "degradada" : "online";
          message = "Porta RTSP respondeu em " + latency + "ms";
        } else {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(url.toString(), { method: "GET", signal: controller.signal, redirect: "manual" });
          clearTimeout(t);
          const latency = Date.now() - started;
          if (res.ok || res.status === 401 || res.status === 403) {
            status = latency > 1500 ? "degradada" : "online";
            message = "Resposta HTTP " + res.status + " em " + latency + "ms";
          } else {
            status = "degradada";
            message = "HTTP " + res.status;
          }
        }
      } catch (err) {
        status = "offline";
        message = err instanceof Error && (err.name === "AbortError" || err.message === "timeout") ? "Sem resposta (tempo esgotado)" : "Sem resposta (falha de conexão)";
      }
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
        title: "Câmera offline: " + camera.name,
        message: message,
        link: "/cameras/" + id,
      },
    });
  }

  return NextResponse.json({ ok: true, health });
}
