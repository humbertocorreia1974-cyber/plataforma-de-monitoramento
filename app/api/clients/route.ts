import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'user';
  if (role !== 'admin') return NextResponse.json({ error: 'Só admin cadastra cliente' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, document, contactName, contactEmail, contactPhone } = body ?? {};
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  const created = await prisma.client.create({
    data: {
      name: String(name).trim(),
      document: document || null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id as string,
      actorRole: role,
      action: 'create',
      entityType: 'Client',
      entityId: created.id,
      after: created as any,
    },
  }).catch(() => {});

  return NextResponse.json({ client: created }, { status: 201 });
}
