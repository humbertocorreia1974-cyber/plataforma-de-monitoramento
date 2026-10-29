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

  const cameras = await prisma.camera.findMany({ orderBy: { name: 'asc' }, include: { site: true } });
  return NextResponse.json({ cameras });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['admin', 'operador'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { siteId, name, code, manufacturer, model, serialNumber, rtspUrl, onvifUrl } = body ?? {};
  if (!siteId || !name || !String(name).trim()) {
    return NextResponse.json({ error: 'siteId e name são obrigatórios' }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return NextResponse.json({ error: 'Site não encontrado' }, { status: 404 });

  const created = await prisma.camera.create({
    data: {
      siteId,
      name: String(name).trim(),
      code: code || null,
      manufacturer: manufacturer || null,
      model: model || null,
      serialNumber: serialNumber || null,
      rtspUrl: rtspUrl || null,
      onvifUrl: onvifUrl || null,
      // 'offline' até o primeiro health-check real confirmar conexão — nunca assumir 'online' sem checar.
      status: 'offline',
      healthStatus: 'unknown',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id as string,
      actorRole: role,
      action: 'create',
      entityType: 'Camera',
      entityId: created.id,
      after: created as any,
    },
  }).catch(() => {});

  return NextResponse.json({ camera: created }, { status: 201 });
}
