'use client';
import { useState } from 'react';

// Widget do Assistente de Atendimento JGNEXT. Aparece só se
// NEXT_PUBLIC_JGNEXT_ASSISTANT === 'on'. Fala com /api/assistant.
export function JgnextAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  if (process.env.NEXT_PUBLIC_JGNEXT_ASSISTANT !== 'on') return null;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const d = await r.json();
      setMsgs((m) => [...m, { role: 'bot', text: d.reply || 'Não consegui responder agora.' }]);
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: 'Falha de conexão. Tente de novo.' }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 50 }}>
      {open && (
        <div style={{ width: 320, height: 420, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600 }}>Atendimento</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgs.length === 0 && <p style={{ color: '#888', fontSize: 14 }}>Oi! Como posso ajudar?</p>}
            {msgs.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '8px 10px', borderRadius: 10, fontSize: 14, background: m.role === 'user' ? '#111827' : '#f3f4f6', color: m.role === 'user' ? '#fff' : '#111' }}>{m.text}</div>
            ))}
            {loading && <div style={{ color: '#888', fontSize: 13 }}>digitando…</div>}
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid #eee' }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Escreva sua mensagem" style={{ flex: 1, border: 0, padding: 12, fontSize: 14, outline: 'none' }} />
            <button onClick={send} style={{ border: 0, background: '#111827', color: '#fff', padding: '0 16px', cursor: 'pointer' }}>›</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label="Abrir atendimento" style={{ marginTop: 8, width: 56, height: 56, borderRadius: 28, border: 0, background: '#111827', color: '#fff', fontSize: 22, cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,.2)' }}>{open ? '×' : '💬'}</button>
    </div>
  );
}
