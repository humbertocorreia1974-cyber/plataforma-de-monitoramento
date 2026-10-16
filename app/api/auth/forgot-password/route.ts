import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { createResetToken } from '@/lib/reset-token';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: '' }));
  const generic = NextResponse.json({ message: 'Se o e-mail existir, enviamos um link de redefinição.' });
  if (!email) return generic;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = createResetToken(email);
      const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const link = `${base}/redefinir-senha?token=${token}`;
      await sendEmail({
        to: email,
        subject: 'Redefinição de senha',
        html: `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="${link}">Clique aqui para criar uma nova senha</a> (expira em 1 hora).</p><p>Se não foi você, ignore este e-mail.</p>`,
      });
    }
  } catch (e) {
    console.error('[forgot-password]', (e as Error).message);
  }
  return generic; // nunca revela se o e-mail existe (anti-enumeração)
}
