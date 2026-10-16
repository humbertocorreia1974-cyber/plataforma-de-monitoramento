'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { EventoFila } from './fila-client';

const CLASSES = [
  { v: 'pessoa', l: 'Pessoa' },
  { v: 'veiculo', l: 'Veículo' },
  { v: 'objeto', l: 'Objeto' },
  { v: 'desconhecido', l: 'Desconhecido' },
] as const;

const SEVERIDADES = [
  { v: 'baixa', l: 'Baixa' },
  { v: 'media', l: 'Média' },
  { v: 'alta', l: 'Alta' },
  { v: 'critica', l: 'Crítica' },
] as const;

export function EventoAcoes({
  event,
  onDone,
}: {
  event: EventoFila;
  onDone: (id: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'classify' | 'discard' | 'escalate'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function post(path: string, body: Record<string, unknown>, tag: string) {
    setBusy(tag);
    setError(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Falha na ação');
      }
      onDone(event.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2 pt-1">
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-500">
          {error}
        </p>
      )}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => post(`/api/events/${event.id}/seen`, {}, 'seen')}
            disabled={busy !== null}
          >
            {busy === 'seen' ? '…' : 'Visto'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setMode('classify')}>
            Classificar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode('discard')}>
            Descartar
          </Button>
          <Button size="sm" variant="primary" onClick={() => setMode('escalate')}>
            Escalar
          </Button>
        </div>
      )}

      {mode === 'classify' && (
        <div className="flex flex-wrap gap-1.5">
          {CLASSES.map((c) => (
            <Button
              key={c.v}
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() =>
                post(`/api/events/${event.id}/classify`, { classification: c.v }, c.v)
              }
            >
              {busy === c.v ? '…' : c.l}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setMode('idle')}>
            Voltar
          </Button>
        </div>
      )}

      {mode === 'discard' && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            post(
              `/api/events/${event.id}/discard`,
              { reason: String(fd.get('reason') ?? '') },
              'discard',
            );
          }}
        >
          <input
            name="reason"
            required
            placeholder="Motivo do descarte (ex: animal doméstico)"
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg placeholder:text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          />
          <div className="flex gap-1.5">
            <Button size="sm" variant="primary" type="submit" disabled={busy !== null}>
              {busy === 'discard' ? '…' : 'Confirmar'}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setMode('idle')}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {mode === 'escalate' && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            post(
              `/api/events/${event.id}/escalate`,
              {
                title: String(fd.get('title') ?? ''),
                description: String(fd.get('description') ?? ''),
                severity: String(fd.get('severity') ?? 'media'),
              },
              'escalate',
            );
          }}
        >
          <input
            name="title"
            required
            placeholder="Título do incidente"
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg placeholder:text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg placeholder:text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          />
          <select
            name="severity"
            defaultValue="media"
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            {SEVERIDADES.map((s) => (
              <option key={s.v} value={s.v}>
                Severidade: {s.l}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <Button size="sm" variant="primary" type="submit" disabled={busy !== null}>
              {busy === 'escalate' ? '…' : 'Criar incidente'}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setMode('idle')}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
