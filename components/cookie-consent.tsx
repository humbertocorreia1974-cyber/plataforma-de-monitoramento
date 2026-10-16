'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie-consent-v1';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* localStorage indisponível (SSR/privado) — não bloqueia o app */ }
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* segue mesmo sem storage */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: '#111827', color: '#fff', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      <p style={{ margin: 0, fontSize: '0.875rem', maxWidth: 640 }}>
        Usamos cookies essenciais para o funcionamento do app. Ao continuar navegando, você concorda com nossa{' '}
        <Link href="/privacidade" style={{ textDecoration: 'underline' }}>Política de Privacidade</Link>.
      </p>
      <button onClick={accept} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 0, background: '#fff', color: '#111827', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Entendi
      </button>
    </div>
  );
}
