import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });

  const body = await request.json();
  const { description, cost, performedAt } = body ?? {};
  if (!description) return NextResponse.json({ error: 'description é obrigatório' }, { status: 400 });

  const maintenance = await prisma.inventoryItemMaintenance.create({
    data: {
      inventoryItemId: id,
      description,
      cost: cost === '' || cost == null ? null : cost,
      performedAt: performedAt ? new Date(performedAt) : new Date(),
      performedById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role,
      action: 'create',
      entityType: 'InventoryItemMaintenance',
      entityId: maintenance.id,
      after: { inventoryItemId: id, description } as any,
    },
  });

  return NextResponse.json({ maintenance }, { status: 201 });
}
