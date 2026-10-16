'use client';

import { useState, useTransition } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Row = {
  id: string;
  name: string;
  siteName: string;
  clientName: string;
  status: string;
  sensitivity: number;
  cooldownSeconds: number;
  ruleId: string | null;
  zone: string | null;
  events7d: number;
  avgMotion: number;
  maxMotion: number;
};

export function MotionPrefilterClient({ rows }: { rows: Row[] }) {
  const [items, setItems] = useState(rows);
  const [editing, setEditing] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [cooldown, setCooldown] = useState(30);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function openEdit(row: Row) {
    setEditing(row.id);
    setSensitivity(row.sensitivity);
    setCooldown(row.cooldownSeconds);
    setFeedback(null);
  }

  async function save(cameraId: string) {
    setFeedback(null);
    const res = await fetch('/api/motion-prefilter', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cameraId, sensitivity, cooldownSeconds: cooldown }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFeedback({ type: 'err', msg: data.error ?? 'Falha ao salvar' });
      return;
    }
    setItems((prev) =>
      prev.map((r) =>
        r.id === cameraId
          ? { ...r, sensitivity, cooldownSeconds: cooldown, ruleId: r.ruleId ?? 'novo' }
          : r
      )
    );
    setFeedback({ type: 'ok', msg: 'Regra atualizada com sucesso.' });
    startTransition(() => setEditing(null));
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          role="status"
          className={
            feedback.type === 'ok'
              ? 'rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand'
              : 'rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600'
          }
        >
          {feedback.msg}
        </div>
      )}

      <Card>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                <th className="py-2 pr-4">Câmera</th>
                <th className="py-2 pr-4">Site / Cliente</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Sensibilidade</th>
                <th className="py-2 pr-4">Cooldown</th>
                <th className="py-2 pr-4">Eventos 7d</th>
                <th className="py-2 pr-4">motionScore</th>
                <th className="py-2 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 last:border-0 transition-colors duration-150 hover:bg-surface/60"
                >
                  <td className="py-3 pr-4 font-medium text-fg">{row.name}</td>
                  <td className="py-3 pr-4 text-fg-muted">
                    <div>{row.siteName}</div>
                    <div className="text-xs">{row.clientName}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        row.status === 'online'
                          ? 'rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand'
                          : 'rounded-full bg-surface px-2 py-0.5 text-xs text-fg-muted'
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-fg-muted">
                    {editing === row.id ? (
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={sensitivity}
                        onChange={(e) => setSensitivity(Number(e.target.value))}
                        className="w-24"
                      />
                    ) : (
                      row.sensitivity.toFixed(2)
                    )}
                  </td>
                  <td className="py-3 pr-4 text-fg-muted">
                    {editing === row.id ? (
                      <Input
                        type="number"
                        min={1}
                        max={600}
                        value={cooldown}
                        onChange={(e) => setCooldown(Number(e.target.value))}
                        className="w-24"
                      />
                    ) : (
                      `${row.cooldownSeconds}s`
                    )}
                  </td>
                  <td className="py-3 pr-4 text-fg-muted">{row.events7d}</td>
                  <td className="py-3 pr-4 text-fg-muted">
                    <span className="text-fg">{(row.avgMotion * 100).toFixed(1)}%</span>
                    <span className="ml-1 text-xs">
                      (máx {(row.maxMotion * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {editing === row.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={pending}
                          onClick={() => save(row.id)}
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
                        Ajustar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
