'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { EventoAcoes } from './evento-acoes-client';

type SiteOpt = { id: string; name: string; code: string | null; clientName: string };

export type EventoFila = {
  id: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  cameraName: string;
  occurredAt: string;
  snapshotUrl: string | null;
  motionScore: number | null;
  aiLabel: string | null;
  aiConfidence: number | null;
  status: string;
  classification: string | null;
};

function statusTone(status: string) {
  if (status === 'escalado') return 'bg-danger/90 text-danger-fg';
  if (status === 'descartado') return 'bg-fg-muted/80 text-white';
  if (status === 'classificado') return 'bg-brand/90 text-brand-fg';
  return 'bg-black/60 text-white';
}

export function FilaClient({
  sites,
  initialEvents,
}: {
  sites: SiteOpt[];
  initialEvents: EventoFila[];
}) {
  const [events, setEvents] = useState<EventoFila[]>(initialEvents);
  const [siteFilter, setSiteFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events/stream');
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as EventoFila;
        if (!data?.id) return;
        setEvents((prev) => {
          if (prev.some((e) => e.id === data.id)) return prev;
          return [data, ...prev].slice(0, 200);
        });
      } catch {
        /* ignore malformed */
      }
    };
    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (siteFilter && e.siteId !== siteFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    });
  }, [events, siteFilter, statusFilter]);

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-fg-muted">
            Site
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="ml-2 rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <option value="">Todos</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `· ${s.code}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-fg-muted">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ml-2 rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <option value="">Todos</option>
              <option value="novo">Novo</option>
              <option value="em_analise">Em análise</option>
            </select>
          </label>
          <span className="ml-auto text-xs text-fg-muted">
            {filtered.length} evento(s) ·{' '}
            <span className={connected ? 'text-emerald-500' : 'text-amber-500'}>
              {connected ? 'ao vivo' : 'reconectando…'}
            </span>
          </span>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-fg-muted">
              Nenhum evento na fila. Assim que o gateway do cliente detectar movimento e o
              CodeProject.AI classificar o snapshot, o evento aparece aqui automaticamente.
            </p>
          </CardBody>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev) => (
            <li key={ev.id}>
              <Card className="overflow-hidden">
                <div className="relative aspect-video w-full bg-black/40">
                  {ev.snapshotUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.snapshotUrl}
                      alt={`Snapshot do evento em ${ev.siteName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-fg-muted">
                      Sem snapshot
                    </div>
                  )}
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusTone(ev.status)}`}>
                    {ev.status.replace('_', ' ')}
                  </span>
                  {typeof ev.aiConfidence === 'number' && (
                    <span className="absolute right-2 top-2 rounded-full bg-brand/90 px-2 py-0.5 text-[10px] font-medium text-brand-fg">
                      {ev.aiLabel ?? '?'} · {(ev.aiConfidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-fg">{ev.cameraName}</p>
                      <p className="text-xs text-fg-muted">
                        {ev.siteName}
                        {ev.siteCode ? ` · ${ev.siteCode}` : ''}
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-[11px] text-fg-muted"
                      dateTime={ev.occurredAt}
                    >
                      {new Date(ev.occurredAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  {typeof ev.motionScore === 'number' && (
                    <p className="text-[11px] text-fg-muted">
                      Movimento: {(ev.motionScore * 100).toFixed(0)}%
                    </p>
                  )}
                  <EventoAcoes event={ev} onDone={removeEvent} />
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
