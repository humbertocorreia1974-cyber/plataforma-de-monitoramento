import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Verificação do webhook (Meta exige isso no cadastro da URL).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'verificação inválida' }, { status: 403 });
}

// Mensagem recebida (Instagram/Facebook DM) -> encaminha pro cérebro
// unificado do Assistente JGNEXT (mesmo endpoint do chat embutido/WhatsApp).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const base = process.env.JGNEXT_API_BASE_URL;
  const token = process.env.JGNEXT_CHATBOT_TOKEN;
  if (!base || !token || !body) return NextResponse.json({ received: true });
  try {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0] || entry?.changes?.[0]?.value?.messages?.[0];
    const text = messaging?.message?.text || messaging?.text?.body;
    const from = messaging?.sender?.id || messaging?.from;
    if (text && from) {
      await fetch(base + '/api/v1/embedded-chatbot/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ message: text, channel: 'social', customerContact: String(from) }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('[social webhook]', (e as Error).message);
  }
  return NextResponse.json({ received: true });
}
