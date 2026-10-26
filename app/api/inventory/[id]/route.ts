import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      client: true,
      site: true,
      camera: true,
      sensor: true,
      assignments: { orderBy: { assignedAt: 'desc' }, include: { client: true, site: true } },
      maintenances: { orderBy: { performedAt: 'desc' }, include: { performedBy: true } },
    },
  });
  if (!item) return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const before = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.ownership !== undefined) data.ownership = body.ownership;
  if (body.clientId !== undefined) data.clientId = body.clientId || null;
  if (body.siteId !== undefined) data.siteId = body.siteId || null;
  if (body.cameraId !== undefined) data.cameraId = body.cameraId || null;
  if (body.sensorId !== undefined) data.sensorId = body.sensorId || null;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
  if (body.purchaseCost !== undefined) data.purchaseCost = body.purchaseCost === '' || body.purchaseCost == null ? null : body.purchaseCost;
  if (body.warrantyExpiresAt !== undefined) data.warrantyExpiresAt = body.warrantyExpiresAt ? new Date(body.warrantyExpiresAt) : null;

  const nextClientId = body.clientId !== undefined ? (body.clientId || null) : before.clientId;
  const nextSiteId = body.siteId !== undefined ? (body.siteId || null) : before.siteId;
  const custodyChanged = nextClientId !== before.clientId || nextSiteId !== before.siteId;

  if (custodyChanged) {
    // Reatribuição real: encerra a custódia aberta e abre uma nova, em vez de
    // só sobrescrever installedAt/removedAt (perdia o histórico anterior).
    await prisma.inventoryItemAssignment.updateMany({
      where: { inventoryItemId: id, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });
    if (nextClientId || nextSiteId) {
      await prisma.inventoryItemAssignment.create({
        data: {
          inventoryItemId: id,
          clientId: nextClientId,
          siteId: nextSiteId,
          reason: body.reassignReason || null,
        },
      });
      data.installedAt = new Date();
      data.removedAt = null;
    } else {
      data.removedAt = new Date();
    }
  }

  const item = await prisma.inventoryItem.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role,
      action: 'update',
      entityType: 'InventoryItem',
      entityId: id,
      before: { status: before.status, clientId: before.clientId, siteId: before.siteId } as any,
      after: { status: item.status, clientId: item.clientId, siteId: item.siteId } as any,
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
