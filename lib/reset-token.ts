import crypto from 'crypto';

// Token de redefinição de senha assinado (HMAC) — sem precisar de tabela no
// banco. Expira em 1h. `email:expiraEm:assinatura` em base64url.
const SECRET = process.env.NEXTAUTH_SECRET || process.env.RESET_TOKEN_SECRET || 'dev-secret-troque-em-producao';

export function createResetToken(email: string): string {
  const exp = Date.now() + 60 * 60 * 1000;
  const payload = `${email}:${exp}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyResetToken(token: string): { email: string } | null {
  try {
    const [email, expStr, sig] = Buffer.from(token, 'base64url').toString('utf8').split(':');
    const exp = Number(expStr);
    if (!email || !exp || !sig) return null;
    if (Date.now() > exp) return null;
    const expected = crypto.createHmac('sha256', SECRET).update(`${email}:${exp}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { email };
  } catch {
    return null;
  }
}
