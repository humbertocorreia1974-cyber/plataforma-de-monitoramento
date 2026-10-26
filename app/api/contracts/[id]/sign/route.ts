import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const role = (session.user as any).role as string;
  const sessionClientId = (session.user as any).clientId as string | undefined;
  const isAdmin = role === 'admin';
  const isCliente = role === 'cliente';
  if (!isAdmin && !isCliente) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  if (isCliente && contract.clientId !== sessionClientId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json();
  const { signerName, signerDocument, signatureData } = body ?? {};
  if (!signerName || !signatureData) {
    return NextResponse.json({ error: 'signerName e signatureData são obrigatórios' }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent') ?? null;

  const signature = await prisma.contractSignature.create({
    data: {
      contractId: id,
      signerName,
      signerDocument: signerDocument || null,
      signatureData,
      ipAddress,
      userAgent,
    },
  });

  const updated = await prisma.contract.update({
    where: { id },
    data: { signedAt: signature.signedAt },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: role,
      action: 'update',
      entityType: 'Contract',
      entityId: id,
      after: { signedAt: updated.signedAt, signerName } as any,
      ip: ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ signature, contract: updated }, { status: 201 });
}
