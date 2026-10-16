import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
  const reason = String(body.reason ?? '').trim();
  if (reason.length < 3) {
    return NextResponse.json({ error: 'Informe o motivo do descarte' }, { status: 400 });
  }

  const ev = await prisma.event.findUnique({ where: { id } });
  if (!ev) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent') ?? null;

  const updated = await prisma.event.update({
    where: { id },
    data: {
      status: 'descartado',
      discardedById: session.user.id,
      discardedAt: new Date(),
      discardReason: reason,
      seenById: ev.seenById ?? session.user.id,
      seenAt: ev.seenAt ?? new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role ?? null,
      action: 'discard',
      entityType: 'Event',
      entityId: id,
      before: { status: ev.status },
      after: { status: 'descartado', reason },
      ip,
      userAgent,
      eventId: id,
    },
  });

  return NextResponse.json({ ok: true, event: updated });
}
