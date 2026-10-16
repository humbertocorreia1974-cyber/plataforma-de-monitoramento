import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  return NextResponse.json({ ok: true, event: updated, incident });
}
