import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyResetToken } from '@/lib/reset-token';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { token, password } = await request.json().catch(() => ({}));
  if (!token || !password || String(password).length < 6) {
    return NextResponse.json({ error: 'Token e senha (mín. 6 caracteres) são obrigatórios.' }, { status: 400 });
  }
  const verified = verifyResetToken(token);
  if (!verified) return NextResponse.json({ error: 'Link inválido ou expirado. Peça um novo.' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.user.update({ where: { email: verified.email }, data: { passwordHash } });
    return NextResponse.json({ message: 'Senha redefinida com sucesso.' });
  } catch (e) {
    return NextResponse.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 });
  }
}
