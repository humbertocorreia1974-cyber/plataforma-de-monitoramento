'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ClientOpt = { id: string; name: string };

export function SiteFormClient({ clients }: { clients: ClientOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      clientId: String(fd.get('clientId') || ''),
      name: String(fd.get('name') || '').trim(),
      code: String(fd.get('code') || '').trim() || null,
      address: String(fd.get('address') || '').trim() || null,
      city: String(fd.get('city') || '').trim() || null,
      state: String(fd.get('state') || '').trim() || null,
    };
    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao cadastrar site.');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        + Novo site
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6 backdrop-blur">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs text-fg-muted">
          Cliente *
          <select
            name="clientId"
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-fg-muted">
          Nome do site *
          <Input name="name" required className="mt-1" placeholder="Ex: Matriz, Loja Centro…" />
        </label>
        <label className="text-xs text-fg-muted">
          Código interno
          <Input name="code" className="mt-1" placeholder="Ex: SITE-001" />
        </label>
        <label className="text-xs text-fg-muted">
          Cidade
          <Input name="city" className="mt-1" />
        </label>
        <label className="text-xs text-fg-muted">
          UF
          <Input name="state" className="mt-1" maxLength={2} placeholder="SP" />
        </label>
        <label className="text-xs text-fg-muted sm:col-span-2">
          Endereço
          <Input name="address" className="mt-1" />
        </label>
        {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Salvando…' : 'Cadastrar site'}
          </Button>
        </div>
      </form>
    </div>
  );
}
