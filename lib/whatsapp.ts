export async function sendWhatsAppText(to: string, body: string) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneId || !token) {
    console.warn("[whatsapp] credenciais ausentes — mensagem não enviada");
    return { ok: false, skipped: true };
  }
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function sendWhatsAppAlert(to: string, title: string, message: string) {
  return sendWhatsAppText(to, `🚨 *${title}*\n\n${message}`);
}
