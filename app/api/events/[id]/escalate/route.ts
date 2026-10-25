import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendPushToUsers } from '@/lib/webpush';

export const dynamic = 'force-dynamic';

const SEV = ['baixa', 'media', 'alta', 'critica'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const severity = String(body.severity ?? 'media');
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim() || null;

  if (!SEV.includes(severity)) {
    return NextResponse.json({ error: 'Severidade inválida' }, { status: 400 });
  }
  if (title.length < 3) {
    return NextResponse.json({ error: 'Informe um título para o incidente' }, { status: 400 });
  }

  const ev = await prisma.event.findUnique({
    where: { id },
    include: { site: { select: { id: true, name: true, clientId: true } } },
  });
  if (!ev) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent') ?? null;

  const incident = await prisma.incident.create({
    data: {
      clientId: ev.site.clientId,
      siteId: ev.siteId,
      cameraId: ev.cameraId,
      title,
      description,
      severity,
      status: 'aberto',
      reportedById: session.user.id,
      snapshotUrl: ev.snapshotUrl,
    },
  });

  const updated = await prisma.event.update({
    where: { id },
    data: {
      status: 'escalado',
      incidentId: incident.id,
      seenById: ev.seenById ?? session.user.id,
      seenAt: ev.seenAt ?? new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role ?? null,
      action: 'escalate',
      entityType: 'Event',
      entityId: id,
      before: { status: ev.status },
      after: { status: 'escalado', incidentId: incident.id, severity },
      ip,
      userAgent,
      eventId: id,
      incidentId: incident.id,
    },
  });

  // Notifica admins e operadores do site
  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'operador'] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'incidente_escalado',
        title: `Incidente ${severity.toUpperCase()} — ${ev.site.name}`,
        message: title,
        link: `/incidentes/${incident.id}`,
      })),
    });
  }

  // Alerta por e-mail para os operadores com acesso a este Site (SiteOperator)
  const siteOperators = await prisma.siteOperator.findMany({
    where: { siteId: ev.siteId },
    select: { userId: true, user: { select: { email: true, name: true } } },
  });
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const operacaoLink = `${appUrl}/operacao`;
  await Promise.all(
    siteOperators
      .filter((so) => !!so.user.email)
      .map((so) =>
        sendEmail({
          to: so.user.email as string,
          subject: `Incidente ${severity.toUpperCase()} escalado — ${ev.site.name}`,
          html: `
            <p>Um incidente foi escalado no site <strong>${ev.site.name}</strong>.</p>
            <p><strong>${title}</strong></p>
            ${description ? `<p>${description}</p>` : ''}
            <p>Severidade: <strong>${severity}</strong></p>
            <p><a href="${operacaoLink}">Abrir a Central de Operação</a></p>
          `,
        })
      )
  );

  // Push real no navegador (Web Push/VAPID) para os mesmos destinatários do
  // e-mail (operadores do site) + admins já notificados acima. Complementa o
  // e-mail, não substitui. SMS (Twilio) fica para depois — ver TODO em lib/webpush.ts.
  const pushUserIds = Array.from(
    new Set([...siteOperators.map((so) => so.userId), ...admins.map((a) => a.id)])
  );
  sendPushToUsers(pushUserIds, {
    title: `Incidente ${severity.toUpperCase()} — ${ev.site.name}`,
    body: title,
    url: `/incidentes/${incident.id}`,
  }).catch((e) => console.error('escalate push failed', e));

  return NextResponse.json({ ok: true, event: updated, incident });
}
