'use client';

import { useEffect, useState } from 'react';

export default function WhatsappConnectPage() {
  const [status, setStatus] = useState('carregando...');
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/whatsapp-baileys/status');
        const data = await res.json();
        setStatus(data.status);
        setQr(data.qr);
      } catch (e) {
        setStatus('erro ao consultar status');
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '3rem', textAlign: 'center' }}>
      <h1>Conectar WhatsApp</h1>
      <p>Status: {status === 'connected' ? '🟢 conectado' : status === 'connecting' ? '🟡 aguardando leitura do QR code' : '🔴 desconectado'}</p>
      {qr && (
        <div>
          <p>Abra o WhatsApp no seu celular → Configurações → Aparelhos conectados → Conectar um aparelho, e escaneie:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code para conectar o WhatsApp" style={{ maxWidth: 300 }} />
        </div>
      )}
      {status === 'connected' && <p>Seu WhatsApp está conectado e pronto pra enviar notificações.</p>}
    </main>
  );
}
