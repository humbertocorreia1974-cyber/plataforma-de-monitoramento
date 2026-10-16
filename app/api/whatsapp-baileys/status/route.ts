import { NextResponse } from 'next/server';
import { ensureStarted, getQrCodeDataUrl, getConnectionStatus } from '@/lib/whatsapp-baileys';
import { requireRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// 🛡️ 2026-09-14: só admin vê o QR code de pareamento - antes era público
// (qualquer um podia sequestrar a conexão do WhatsApp do app escaneando
// antes do admin de verdade).
export async function GET() {
  try {
    await requireRole(['admin']);
  } catch {
    return NextResponse.json({ error: 'Não autenticado ou sem permissão.' }, { status: 401 });
  }
  ensureStarted().catch(() => {});
  const qr = await getQrCodeDataUrl();
  return NextResponse.json({ status: await getConnectionStatus(), qr });
}
