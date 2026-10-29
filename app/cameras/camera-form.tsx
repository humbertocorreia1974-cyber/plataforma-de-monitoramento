'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SiteOpt = { id: string; name: string; code: string | null; client: { name: string } };

export function CameraFormClient({ sites }: { sites: SiteOpt[] }) {
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
      siteId: String(fd.get('siteId') || ''),
      name: String(fd.get('name') || '').trim(),
      code: String(fd.get('code') || '').trim() || null,
      manufacturer: String(fd.get('manufacturer') || '').trim() || null,
      model: String(fd.get('model') || '').trim() || null,
      serialNumber: String(fd.get('serialNumber') || '').trim() || null,
      rtspUrl: String(fd.get('rtspUrl') || '').trim() || null,
      onvifUrl: String(fd.get('onvifUrl') || '').trim() || null,
    };
    const res = await fetch('/api/cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao cadastrar câmera.');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        + Nova câmera
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6 backdrop-blur">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs text-fg-muted">
          Site *
          <select
            name="siteId"
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Selecione…</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.client.name} — {s.name}{s.code ? ` (${s.code})` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-fg-muted">
          Nome da câmera *
          <Input name="name" required className="mt-1" placeholder="Ex: Entrada principal" />
        </label>
        <label className="text-xs text-fg-muted sm:col-span-2">
          URL RTSP
          <Input name="rtspUrl" className="mt-1" placeholder="rtsp://usuario:senha@192.168.0.10:554/stream1" />
        </label>
        <label className="text-xs text-fg-muted sm:col-span-2">
          URL ONVIF
          <Input name="onvifUrl" className="mt-1" placeholder="http://192.168.0.10:80/onvif/device_service" />
        </label>
        <p className="-mt-2 text-xs text-fg-muted sm:col-span-2">
          Sem pelo menos uma dessas URLs a câmera fica sem conexão real — o teste de saúde não tem o que verificar.
        </p>
        <label className="text-xs text-fg-muted">
          Código interno
          <Input name="code" className="mt-1" placeholder="Ex: CAM-001" />
        </label>
        <label className="text-xs text-fg-muted">
          Número de série
          <Input name="serialNumber" className="mt-1" />
        </label>
        <label className="text-xs text-fg-muted">
          Fabricante
          <Input name="manufacturer" className="mt-1" placeholder="Intelbras, Hikvision…" />
        </label>
        <label className="text-xs text-fg-muted">
          Modelo
          <Input name="model" className="mt-1" />
        </label>
        {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Salvando…' : 'Cadastrar câmera'}
          </Button>
        </div>
      </form>
    </div>
  );
}
