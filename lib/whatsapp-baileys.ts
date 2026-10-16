const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL;
const GATEWAY_KEY = process.env.WHATSAPP_GATEWAY_KEY;
const WORKSPACE_ID = process.env.WHATSAPP_WORKSPACE_ID;

function configured() {
  return !!(GATEWAY_URL && GATEWAY_KEY && WORKSPACE_ID);
}

function base() {
  return GATEWAY_URL + '/' + WORKSPACE_ID;
}

export async function ensureStarted() {
  if (!configured()) return;
  await fetch(base() + '/connect', {
    method: 'POST',
    headers: { 'x-api-key': GATEWAY_KEY },
  }).catch(() => {});
}

export async function getQrCodeDataUrl() {
  if (!configured()) return null;
  try {
    const res = await fetch(base() + '/status', {
      headers: { 'x-api-key': GATEWAY_KEY },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.qr ?? null;
  } catch {
    return null;
  }
}

export async function getConnectionStatus() {
  if (!configured()) return 'disconnected';
  try {
    const res = await fetch(base() + '/status', {
      headers: { 'x-api-key': GATEWAY_KEY },
      cache: 'no-store',
    });
    if (!res.ok) return 'disconnected';
    const data = await res.json();
    if (data?.connected) return 'connected';
    if (data?.state === 'WAITING_QR' || data?.state === 'CONNECTING') return 'connecting';
    return 'disconnected';
  } catch {
    return 'disconnected';
  }
}

export async function sendWhatsAppMessage(to, text) {
  if (!configured()) {
    throw new Error('Gateway de WhatsApp não configurado neste deploy.');
  }
  const res = await fetch(base() + '/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': GATEWAY_KEY },
    body: JSON.stringify({ to, message: text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Falha ao enviar mensagem pelo gateway de WhatsApp.');
  }
}
