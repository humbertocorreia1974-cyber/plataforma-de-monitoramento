'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Site = { id: string; name: string };

type EventItem = {
  id: string;
  occurredAt: string;
  status: string;
  classification: string | null;
  aiLabel: string | null;
  aiConfidence: number | null;
  motionScore: number | null;
  snapshotUrl: string | null;
  site: { id: string; name: string; client: { name: string } };
  camera: { id: string; name: string } | null;
  detectionRule: { id: string; name: string } | null;
};

const CLASSES = [
  { value: 'pessoa', label: 'Pessoa' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'objeto', label: 'Objeto' },
  { value: 'desconhecido', label: 'Desconhecido' },
];

const SEV = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString('pt-BR');
  } catch {
    return dt;
  }
}

export function EventQueueClient({
  initialEvents,
  sites,
}: {
  initialEvents: EventItem[];
  sites: Site[];
}) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [filterSite, setFilterSite] = useState('');
  const [selected, setSelected] = useState<EventItem | null>(initialEvents[0] ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discardReason, setDiscardReason] = useState('');
  const [incTitle, setIncTitle] = useState('');
  const [incSeverity, setIncSeverity] = useState('media');
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events/stream');
    esRef.current = es;
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === 'events' && Array.isArray(data.events)) {
          setEvents((prev) => {
            const map = new Map(prev.map((e) => [e.id, e]));
            for (const e of data.events as EventItem[]) {
              if (e.status === 'novo' || e.status === 'em_analise') map.set(e.id, e);
            }
            return Array.from(map.values()).sort(
              (a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt)
            );
          });
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, []);

  const filtered = useMemo(
    () => (filterSite ? events.filter((e) => e.site.id === filterSite) : events),
    [events, filterSite]
  );

  useEffect(() => {
    if (!selected && filtered[0]) setSelected(filtered[0]);
  }, [filtered, selected]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  async function act(url: string, body?: unknown, okMsg = 'Feito') {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha');
      flash(okMsg);
      setEvents((prev) =>
        prev
          .map((e) => (e.id === selected.id ? { ...e, ...data.event } : e))
          .filter((e) => e.status === 'novo' || e.status === 'em_analise')
      );
      setSelected(null);
      setDiscardReason('');
      setIncTitle('');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card>
        <CardBody>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-fg-muted" htmlFor="f-site">
              Filtrar por site
            </label>
            <select
              id="f-site"
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <option value="">Todos os sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="ml-auto text-xs text-fg-muted">
              {filtered.length} evento{filtered.length === 1 ? '' : 's'} na fila
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-fg-muted">
                Nenhum evento pendente. A fila está limpa.
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Novos eventos aparecerão aqui automaticamente via SSE.
              </p>
            </div>
          ) : (
            <ul className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
              {filtered.map((e) => {
                const active = selected?.id === e.id;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(e);
                        void act(`/api/events/${e.id}/seen`, undefined, 'Marcado como visto');
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition-all duration-150 ${
                        active
                          ? 'border-brand bg-brand/5'
                          : 'border-border bg-surface hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-fg">
                          {e.camera?.name ?? 'Sensor'} · {e.site.name}
                        </span>
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand">
                          {e.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-fg-muted">
                        {e.site.client.name} · {fmt(e.occurredAt)}
                      </p>
                      <p className="mt-1 text-xs text-fg-muted">
                        IA: {e.aiLabel ?? '—'}
                        {e.aiConfidence != null
                          ? ` (${(e.aiConfidence * 100).toFixed(0)}%)`
                          : ''}
                        {e.motionScore != null
                          ? ` · movimento ${(e.motionScore * 100).toFixed(0)}%`
                          : ''}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {!selected ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="text-sm text-fg-muted">
                Selecione um evento na fila para inspecionar o snapshot e agir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-fg">
                  {selected.camera?.name ?? 'Sensor'} — {selected.site.name}
                </h2>
                <p className="text-xs text-fg-muted">
                  {selected.site.client.name} · {fmt(selected.occurredAt)}
                  {selected.detectionRule ? ` · regra: ${selected.detectionRule.name}` : ''}
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border bg-bg">
                {selected.snapshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.snapshotUrl}
                    alt={`Snapshot do evento em ${selected.site.name}`}
                    className="h-auto w-full object-contain"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs text-fg-muted">
                    Sem snapshot anexado a este evento
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-fg-muted">Classificar</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CLASSES.map((c) => (
                      <Button
                        key={c.value}
                        size="sm"
                        variant={selected.classification === c.value ? 'primary' : 'secondary'}
                        disabled={busy}
                        onClick={() =>
                          act(
                            `/api/events/${selected.id}/classify`,
                            { classification: c.value },
                            `Classificado como ${c.label}`
                          )
                        }
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-fg-muted">Descartar</p>
                  <div className="mt-2 space-y-2">
                    <Input
                      placeholder="Motivo (ex: animal doméstico)"
                      value={discardReason}
                      onChange={(e) => setDiscardReason(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || discardReason.trim().length < 3}
                      onClick={() =>
                        act(
                          `/api/events/${selected.id}/discard`,
                          { reason: discardReason },
                          'Evento descartado'
                        )
                      }
                    >
                      Descartar evento
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-fg-muted">
                  Escalar para Incidente
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <Input
                    placeholder="Título do incidente"
                    value={incTitle}
                    onChange={(e) => setIncTitle(e.target.value)}
                  />
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value)}
                    className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                    aria-label="Severidade"
                  >
                    {SEV.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={busy || incTitle.trim().length < 3}
                    onClick={() =>
                      act(
                        `/api/events/${selected.id}/escalate`,
                        { title: incTitle, severity: incSeverity },
                        'Incidente criado'
                      )
                    }
                  >
                    Escalar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-fg shadow-lg backdrop-blur-sm"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
