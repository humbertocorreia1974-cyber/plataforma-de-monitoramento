import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, jsonError, jsonOk, allowedSiteIds, siteAllowed } from "@/lib/rbac";
import { timingSafeEqual } from "crypto";
import { notifySiteOperators } from "@/lib/notify";

export const dynamic = "force-dynamic";

// CodeProject.AI devolve rótulos em inglês; o app trabalha com pessoa | veiculo | objeto | desconhecido.
function mapLabel(l: unknown): string {
  const s = String(l ?? "").toLowerCase();
  if (s === "person" || s === "pessoa") return "pessoa";
  if (["car", "truck", "bus", "motorcycle", "bicycle", "vehicle", "veiculo"].includes(s)) return "veiculo";
  return s ? "objeto" : "desconhecido";
}

// Gateway leve do cliente: envia snapshot + motionScore.
// Roda CodeProject.AI (POST /v1/vision/detection) e cria Event + AuditLog.
export async function POST(req: NextRequest) {
  // Gateway local autentica por chave (Authorization: Bearer CAMERA_GATEWAY_TOKEN); operador/admin logado também pode enviar.
  const gwKey = process.env.CAMERA_GATEWAY_TOKEN;
  const sentKey = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const viaGateway = !!gwKey && !!sentKey && sentKey.length === gwKey.length && timingSafeEqual(Buffer.from(sentKey), Buffer.from(gwKey));
  const __session = viaGateway ? null : await getServerSession(authOptions as any);
  const __user: any = (__session as any)?.user;
  if (!viaGateway) {
    if (!__user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (!["admin", "operador"].includes(__user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { siteId, cameraId, motionScore, snapshotBase64, occurredAt } = body ?? {};
    if (!siteId || !cameraId) return jsonError("siteId e cameraId obrigatórios");

    const camera = await prisma.camera.findUnique({ where: { id: cameraId } });
    if (!camera) return jsonError("câmera não encontrada", 404);
    if (camera.siteId !== siteId) return jsonError("câmera não pertence ao site informado", 400);
    if (!viaGateway) {
      const allowedIngest = await allowedSiteIds(__user.id, __user.role);
      if (!siteAllowed(allowedIngest, camera.siteId)) return jsonError("sem acesso ao site", 403);
    }

    // Pré-filtro: só processa se houver movimento real
    if (typeof motionScore === "number" && motionScore < 0.02) {
      return jsonOk({ skipped: true, reason: "sem movimento" });
    }

    let aiLabel: string | null = null;
    let aiConfidence: number | null = null;
    let aiRaw: any = null;

    const aiUrl = process.env.CODEPROJECT_AI_URL;
    if (aiUrl && snapshotBase64) {
      try {
        const aiRes = await fetch(`${aiUrl.replace(/\/$/, "")}/v1/vision/detection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: snapshotBase64, min_confidence: 0.4 }),
        });
        const aiData = await aiRes.json().catch(() => null);
        aiRaw = aiData;
        const pred = aiData?.predictions?.[0];
        if (pred) {
          aiLabel = mapLabel(pred.label);
          aiConfidence = pred.confidence ?? null;
        }
      } catch (e) {
        console.error("CodeProject.AI falhou", e);
      }
    }

    const event = await prisma.event.create({
      data: {
        siteId,
        cameraId,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        motionScore: typeof motionScore === "number" ? motionScore : null,
        snapshotUrl: typeof snapshotBase64 === "string" && snapshotBase64.length <= 700000 ? "data:image/jpeg;base64," + snapshotBase64 : null,
        aiLabel,
        aiConfidence,
        aiRaw: aiRaw ?? undefined,
        status: "novo",
      },
    });

    await audit({
      action: "create",
      entityType: "Event",
      entityId: event.id,
      after: { siteId, cameraId, aiLabel },
      ip: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
      eventId: event.id,
    });

    if (aiLabel && (aiLabel === "pessoa" || aiLabel === "veiculo")) {
      await notifySiteOperators(camera.siteId, {
        type: "evento_critico",
        title: `Evento ${aiLabel} detectado`,
        message: `Câmera ${camera.name} registrou ${aiLabel} com confiança ${(aiConfidence ?? 0).toFixed(2)}.`,
        link: `/operacao/eventos/${event.id}`,
      });
    }

    return jsonOk({ event });
  } catch (e: any) {
    return jsonError(e?.message ?? "erro", 500);
  }
}
