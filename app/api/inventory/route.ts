import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const where: any = {};
  if (searchParams.get('status')) where.status = searchParams.get('status');
  if (searchParams.get('ownership')) where.ownership = searchParams.get('ownership');
  if (searchParams.get('type')) where.type = searchParams.get('type');

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { client: true, site: true, camera: true, sensor: true },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await request.json();
  const {
    serialNumber, type, manufacturer, model, status, ownership, clientId, siteId, notes,
    purchaseDate, purchaseCost, warrantyExpiresAt,
  } = body ?? {};
  if (!serialNumber || !type) return NextResponse.json({ error: 'serialNumber e type são obrigatórios' }, { status: 400 });

  const exists = await prisma.inventoryItem.findUnique({ where: { serialNumber } });
  if (exists) return NextResponse.json({ error: 'Já existe equipamento com esse serial' }, { status: 409 });

  const created = await prisma.inventoryItem.create({
    data: {
      serialNumber,
      type,
      manufacturer: manufacturer || null,
      model: model || null,
      status: status || 'disponivel',
      ownership: ownership || 'comodato',
      clientId: clientId || null,
      siteId: siteId || null,
      notes: notes || null,
      installedAt: status === 'instalado' ? new Date() : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchaseCost: purchaseCost === '' || purchaseCost == null ? null : purchaseCost,
      warrantyExpiresAt: warrantyExpiresAt ? new Date(warrantyExpiresAt) : null,
    },
  });

  if (created.clientId || created.siteId) {
    await prisma.inventoryItemAssignment.create({
      data: {
        inventoryItemId: created.id,
        clientId: created.clientId,
        siteId: created.siteId,
        reason: 'cadastro inicial',
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role,
      action: 'create',
      entityType: 'InventoryItem',
      entityId: created.id,
      after: created as any,
    },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
