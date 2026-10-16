'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Esqueci minha senha</h1>
      {sent ? (
        <p>Se esse e-mail existir na nossa base, você vai receber um link pra redefinir a senha.</p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }} />
          <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 8, border: 0, background: '#111827', color: '#fff', cursor: 'pointer' }}>{loading ? 'Enviando…' : 'Enviar link de redefinição'}</button>
        </form>
      )}
      <p style={{ marginTop: 16 }}><Link href="/login">Voltar pro login</Link></p>
    </main>
  );
}
