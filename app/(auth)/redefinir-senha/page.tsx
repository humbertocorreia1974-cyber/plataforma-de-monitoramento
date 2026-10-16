'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// 2026-09-05: next build (producao) exige que useSearchParams fique dentro
// de um Suspense, senao a geracao de paginas estaticas falha.
function RedefinirSenhaForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const d = await r.json();
    setLoading(false);
    if (r.ok) { setMsg('Senha redefinida! Redirecionando pro login…'); setTimeout(() => router.push('/login'), 1500); }
    else setMsg(d.error || 'Não foi possível redefinir.');
  }

  if (!token) return <main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}><p>Link inválido — peça um novo em "Esqueci minha senha".</p></main>;

  return (
    <main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Nova senha</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="password" required minLength={8} placeholder="Nova senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 8, border: 0, background: '#111827', color: '#fff', cursor: 'pointer' }}>{loading ? 'Salvando…' : 'Redefinir senha'}</button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>Carregando…</main>}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
