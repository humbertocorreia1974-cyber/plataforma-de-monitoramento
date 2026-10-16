import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { allowedSiteIds, getSessionRole, requireSession } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// SSE — fila de eventos em tempo real
export async function GET() {
  const __session = await getServerSession(authOptions as any);
  if (!(__session as any)?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const session = await requireSession();
  const role = (await getSessionRole())!;
  const allowed = await allowedSiteIds(session.user.id, role);

  const encoder = new TextEncoder();
  let lastSeen = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      send({ type: "hello", at: new Date().toISOString() });

      const interval = setInterval(async () => {
        try {
          const where: any = { occurredAt: { gt: lastSeen } };
          if (allowed !== "all") where.siteId = { in: allowed };
          const events = await prisma.event.findMany({
            where,
            orderBy: { occurredAt: "asc" },
            take: 20,
            include: {
              site: { select: { name: true } },
              camera: { select: { name: true } },
            },
          });
          if (events.length) {
            lastSeen = events[events.length - 1].occurredAt;
            for (const ev of events) send({ type: "event", event: ev });
          } else {
            send({ type: "ping", at: new Date().toISOString() });
          }
        } catch (e) {
          send({ type: "error", message: "falha ao consultar" });
        }
      }, 4000);

      // fecha após 5 min para não vazar
      setTimeout(() => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
