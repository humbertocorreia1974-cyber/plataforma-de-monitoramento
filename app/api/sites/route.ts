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

  const sites = await prisma.site.findMany({ orderBy: { name: 'asc' }, include: { client: true } });
  return NextResponse.json({ sites });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'user';
  if (role !== 'admin') return NextResponse.json({ error: 'Só admin cadastra site' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { clientId, name, code, address, city, state } = body ?? {};
  if (!clientId || !name || !String(name).trim()) {
    return NextResponse.json({ error: 'clientId e name são obrigatórios' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

  const created = await prisma.site.create({
    data: {
      clientId,
      name: String(name).trim(),
      code: code || null,
      address: address || null,
      city: city || null,
      state: state || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id as string,
      actorRole: role,
      action: 'create',
      entityType: 'Site',
      entityId: created.id,
      after: created as any,
    },
  }).catch(() => {});

  return NextResponse.json({ site: created }, { status: 201 });
}
