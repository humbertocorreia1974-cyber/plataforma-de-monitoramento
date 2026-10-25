import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/webpush";

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  email?: boolean;
}) {
  const n = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    },
  });

  // Push real no navegador (Web Push/VAPID) — complementa o e-mail, não
  // substitui. Best-effort: nunca bloqueia nem derruba o fluxo de notificação.
  sendPushToUser(params.userId, {
    title: params.title,
    body: params.message,
    url: params.link,
  }).catch((e) => console.error("notify push failed", e));

  if (params.email) {
    try {
      const user = await prisma.user.findUnique({ where: { id: params.userId } });
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: params.title,
          html: `<p>${params.message}</p>${params.link ? `<p><a href="${params.link}">Abrir</a></p>` : ""}`,
        });
      }
    } catch (e) {
      console.error("notify email failed", e);
    }
  }
  return n;
}

export async function notifyRole(role: string, params: Omit<Parameters<typeof notifyUser>[0], "userId">) {
  const users = await prisma.user.findMany({ where: { role }, select: { id: true } });
  await Promise.all(users.map((u) => notifyUser({ ...params, userId: u.id })));
}
