'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddMaintenanceForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/inventory/${itemId}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, cost: cost || null, performedAt }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao registrar manutenção');
      return;
    }
    setDescription('');
    setCost('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <label className="text-xs text-fg-muted sm:col-span-2">
        Descrição *
        <Input required value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Ex: Troca de fonte, limpeza de lente…" />
      </label>
      <label className="text-xs text-fg-muted">
        Data
        <Input type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} className="mt-1" />
      </label>
      <label className="text-xs text-fg-muted">
        Custo (R$)
        <Input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} className="mt-1" placeholder="0,00" />
      </label>
      {error && <p className="text-sm text-red-500 sm:col-span-4">{error}</p>}
      <div className="sm:col-span-4 flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Registrando…' : 'Registrar manutenção'}</Button>
      </div>
    </form>
  );
}
