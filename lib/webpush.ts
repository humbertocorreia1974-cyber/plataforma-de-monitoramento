// Web Push (VAPID) — notificação real no navegador, sem dependência de serviço
// pago. Complementa o e-mail (não substitui): usado nos mesmos pontos onde o
// app já dispara alerta por e-mail (ver lib/notify.ts e app/api/events/[id]/escalate).
//
// TODO (próxima etapa, pendente decisão de custo do Humberto): adicionar SMS via
// Twilio quando houver provedor configurado. Não implementar sem autorização —
// ver TWILIO_* ausente do .env como sinal de que ainda não foi decidido.
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:suporte@jgnext.com";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!vapidPublicKey || !vapidPrivateKey) return false;
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

// Envia para todas as subscriptions ativas de um usuário. Nunca lança — falha
// de push não pode derrubar o fluxo de alerta (e-mail já é a via garantida).
// Subscriptions expiradas (410/404) são removidas automaticamente.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (e: any) {
        const statusCode = e?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("[webpush] falha ao enviar push", e?.message ?? e);
        }
      }
    })
  );
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  await Promise.all(userIds.map((userId) => sendPushToUser(userId, payload)));
}
