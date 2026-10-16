import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp-baileys';
import { requireRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// Rota INTERNA - a lógica do app (ex: incidente novo, ordem de serviço)
// chama isso pra notificar via WhatsApp. Não é um webhook inbound da Meta.
//
// 🛡️ 2026-09-14: estava totalmente sem autenticação - qualquer um na
// internet podia usar o WhatsApp do app pra mandar mensagem pra qualquer
// número (vetor de spam/abuso). Agora exige sessão de admin OU o token
// interno (INTERNAL_API_TOKEN, já injetado automaticamente no deploy pra
// lógica server-side do próprio app chamar sem sessão de navegador).
async function isAuthorized(request: Request): Promise<boolean> {
  const auth = request.headers.get('authorization');
  const expected = process.env.INTERNAL_API_TOKEN;
  if (expected && auth === `Bearer ${expected}`) return true;
  try {
    await requireRole(['admin']);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  const { to, message } = await request.json();
  if (!to || !message) {
    return NextResponse.json({ error: 'to e message são obrigatórios.' }, { status: 400 });
  }
  try {
    await sendWhatsAppMessage(to, message);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
