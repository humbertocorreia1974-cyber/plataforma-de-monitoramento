'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Client = { id: string; name: string };
type Site = { id: string; name: string; code: string | null; clientId: string };
type Camera = { id: string; name: string; siteId: string };
type Sensor = { id: string; name: string; siteId: string };

type Item = {
  id: string;
  serialNumber: string;
  status: string;
  ownership: string;
  clientId: string | null;
  siteId: string | null;
  cameraId: string | null;
  sensorId: string | null;
};

export default function InventoryRowActions({
  item,
  clients,
  sites,
  cameras,
  sensors,
}: {
  item: Item;
  clients: Client[];
  sites: Site[];
  cameras: Camera[];
  sensors: Sensor[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const [clientId, setClientId] = useState(item.clientId ?? '');
  const [siteId, setSiteId] = useState(item.siteId ?? '');
  const [cameraId, setCameraId] = useState(item.cameraId ?? '');
  const [sensorId, setSensorId] = useState(item.sensorId ?? '');
  const [status, setStatus] = useState(item.status);
  const [ownership, setOwnership] = useState(item.ownership);
  const [error, setError] = useState<string | null>(null);

  const sitesOfClient = clientId ? sites.filter((s) => s.clientId === clientId) : sites;
  const camerasOfSite = siteId ? cameras.filter((c) => c.siteId === siteId) : cameras;
  const sensorsOfSite = siteId ? sensors.filter((s) => s.siteId === siteId) : sensors;

  async function save() {
    setError(null);
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        ownership,
        clientId: clientId || null,
        siteId: siteId || null,
        cameraId: cameraId || null,
        sensorId: sensorId || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao salvar');
      return;
    }
    setOpen(false);
    start(() => router.refresh());
  }

  async function remove() {
    if (!confirm(`Remover equipamento ${item.serialNumber}?`)) return;
    const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao remover');
      return;
    }
    start(() => router.refresh());
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Vincular</Button>
        <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>Remover</Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-fg">Vincular {item.serialNumber}</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs text-fg-muted">
                Cliente
                <select value={clientId} onChange={(e) => { setClientId(e.target.value); setSiteId(''); setCameraId(''); setSensorId(''); }} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                  <option value="">—</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-xs text-fg-muted">
                Site
                <select value={siteId} onChange={(e) => { setSiteId(e.target.value); setCameraId(''); setSensorId(''); }} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                  <option value="">—</option>
                  {sitesOfClient.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
                </select>
              </label>
              <label className="text-xs text-fg-muted">
                Câmera vinculada
                <select value={cameraId} onChange={(e) => setCameraId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                  <option value="">—</option>
                  {camerasOfSite.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-xs text-fg-muted">
                Sensor vinculado
                <select value={sensorId} onChange={(e) => setSensorId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                  <option value="">—</option>
                  {sensorsOfSite.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="text-xs text-fg-muted">
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                  <option value="disponivel">Disponível</option>
                  <option value="instalado">Instalado</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="baixado">Baixado</option>
                </select>
              </label>
              <label className="text-xs text-fg-muted">
                Propriedade
                <select value={ownership} onChange={(e) => setOwnership(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                  <option value="comodato">Comodato</option>
                  <option value="vendido">Vendido</option>
                </select>
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={save} disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
