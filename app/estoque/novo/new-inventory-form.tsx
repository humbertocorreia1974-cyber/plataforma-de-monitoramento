'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Client = { id: string; name: string };
type Site = { id: string; name: string; code: string | null; clientId: string };

export default function NewInventoryForm({ clients, sites }: { clients: Client[]; sites: Site[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    serialNumber: '', type: 'camera', manufacturer: '', model: '',
    status: 'disponivel', ownership: 'comodato', clientId: '', siteId: '', notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sitesOfClient = form.clientId ? sites.filter((s) => s.clientId === form.clientId) : sites;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, clientId: form.clientId || null, siteId: form.siteId || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao cadastrar');
      return;
    }
    router.push('/estoque');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="text-xs text-fg-muted sm:col-span-2">
        Número de série *
        <Input required value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="mt-1" placeholder="Ex: CAM-2024-0001" />
      </label>
      <label className="text-xs text-fg-muted">
        Tipo *
        <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="camera">Câmera</option>
          <option value="sensor">Sensor</option>
          <option value="dvr">DVR</option>
          <option value="nvr">NVR</option>
          <option value="outro">Outro</option>
        </select>
      </label>
      <label className="text-xs text-fg-muted">
        Propriedade *
        <select value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="comodato">Comodato</option>
          <option value="vendido">Vendido</option>
        </select>
      </label>
      <label className="text-xs text-fg-muted">
        Fabricante
        <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="mt-1" placeholder="Intelbras, Hikvision…" />
      </label>
      <label className="text-xs text-fg-muted">
        Modelo
        <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="mt-1" />
      </label>
      <label className="text-xs text-fg-muted">
        Status
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="disponivel">Disponível</option>
          <option value="instalado">Instalado</option>
          <option value="manutencao">Manutenção</option>
          <option value="baixado">Baixado</option>
        </select>
      </label>
      <label className="text-xs text-fg-muted">
        Cliente
        <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, siteId: '' })} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="">—</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="text-xs text-fg-muted">
        Site
        <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="">—</option>
          {sitesOfClient.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
        </select>
      </label>
      <label className="text-xs text-fg-muted sm:col-span-2">
        Observações
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg" />
      </label>
      {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" variant="primary" size="md" disabled={saving}>{saving ? 'Salvando…' : 'Cadastrar equipamento'}</Button>
      </div>
    </form>
  );
}
