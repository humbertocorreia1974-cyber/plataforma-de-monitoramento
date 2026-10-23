import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'user';
  if (role !== 'admin') return NextResponse.json({ error: 'Só admin libera operador' }, { status: 403 });

  const siteId = params.id;
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return NextResponse.json({ error: 'Site não encontrado' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: 'Não existe usuário com esse e-mail. A pessoa precisa criar conta no app antes de ser liberada.' },
      { status: 404 }
    );
  }

  const existing = await prisma.siteOperator.findUnique({
    where: { siteId_userId: { siteId, userId: user.id } },
  });
  if (existing) return NextResponse.json({ error: 'Esse usuário já tem acesso a este site' }, { status: 409 });

  const created = await prisma.siteOperator.create({
    data: { siteId, userId: user.id, grantedById: session.user.id as string },
  });

  if (user.role === 'user') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'operador' } });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id as string,
      actorRole: role,
      action: 'create',
      entityType: 'SiteOperator',
      entityId: created.id,
      after: created as any,
    },
  }).catch(() => {});

  return NextResponse.json({ siteOperator: created }, { status: 201 });
}
