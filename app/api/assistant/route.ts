import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Proxy pro Assistente de Atendimento JGNEXT. Se não estiver configurado,
// responde de forma amigável em vez de quebrar.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { message } = await request.json().catch(() => ({ message: '' }));
  if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
    return NextResponse.json({ reply: 'Envie uma mensagem de até 1000 caracteres.' }, { status: 400 });
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (ip) {
    const recent = await prisma.auditLog.count({
      where: { action: 'assistant_msg', ip, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
    });
    if (recent >= 30) {
      return NextResponse.json({ reply: 'Muitas mensagens em pouco tempo. Tente novamente em alguns minutos.' }, { status: 429 });
    }
    await prisma.auditLog.create({ data: { action: 'assistant_msg', entityType: 'Assistant', entityId: 'web', ip } }).catch(() => {});
  }
  const base = process.env.JGNEXT_API_BASE_URL;
  const token = process.env.JGNEXT_CHATBOT_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ reply: 'O atendimento automático ainda não foi ativado. Fale com a gente pelos canais de contato.' });
  }
  try {
    const r = await fetch(base + '/api/v1/embedded-chatbot/message', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ message, channel: 'web' }),
    });
    const d = await r.json();
    return NextResponse.json({ reply: d.reply || 'Não consegui responder agora.' });
  } catch {
    return NextResponse.json({ reply: 'Estou com dificuldade de conexão. Tente novamente em instantes.' }, { status: 200 });
  }
}
