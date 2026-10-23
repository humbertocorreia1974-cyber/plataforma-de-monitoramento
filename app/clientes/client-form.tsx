'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ClientFormClient() {
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
      name: String(fd.get('name') || '').trim(),
      document: String(fd.get('document') || '').trim() || null,
      contactName: String(fd.get('contactName') || '').trim() || null,
      contactEmail: String(fd.get('contactEmail') || '').trim() || null,
      contactPhone: String(fd.get('contactPhone') || '').trim() || null,
    };
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao cadastrar cliente.');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        + Novo cliente
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6 backdrop-blur">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs text-fg-muted sm:col-span-2">
          Nome do cliente *
          <Input name="name" required className="mt-1" placeholder="Ex: Condomínio Jardins" />
        </label>
        <label className="text-xs text-fg-muted">
          CNPJ/CPF
          <Input name="document" className="mt-1" />
        </label>
        <label className="text-xs text-fg-muted">
          Telefone de contato
          <Input name="contactPhone" className="mt-1" />
        </label>
        <label className="text-xs text-fg-muted">
          Nome do contato
          <Input name="contactName" className="mt-1" />
        </label>
        <label className="text-xs text-fg-muted">
          E-mail do contato
          <Input name="contactEmail" type="email" className="mt-1" />
        </label>
        {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Salvando…' : 'Cadastrar cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
