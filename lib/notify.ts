import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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
