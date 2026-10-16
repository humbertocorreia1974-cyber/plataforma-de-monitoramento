'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type PrefilterValues = {
  enabled: boolean;
  algorithm: string;
  sensitivity: number;
  minAreaPct: number;
  learningRate: number;
  blurKernel: number;
  dilateIterations: number;
  cooldownSeconds: number;
  snapshotOnMotion: boolean;
};

export default function MotionPrefilterForm({
  cameraId,
  initial,
}: {
  cameraId: string;
  initial: PrefilterValues;
}) {
  const [values, setValues] = useState<PrefilterValues>(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setMessage('');
    try {
      const res = await fetch(`/api/motion-prefilter/${cameraId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Falha ao salvar');
      }
      setStatus('ok');
      setMessage('Configuração salva.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erro inesperado');
    }
  }

  return (
    <form
      onSubmit={save}
      className="rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          Ajustes do pré-filtro
        </span>
        <label className="flex items-center gap-2 text-xs text-fg">
          <input
            type="checkbox"
            checked={values.enabled}
            onChange={(e) => setValues({ ...values, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Ativo
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted">Algoritmo</span>
          <select
            value={values.algorithm}
            onChange={(e) => setValues({ ...values, algorithm: e.target.value })}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-fg"
          >
            <option value="MOG2">MOG2</option>
            <option value="KNN">KNN</option>
            <option value="FRAME_DIFF">Frame diff</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted">Cooldown (s)</span>
          <input
            type="number"
            min={0}
            max={120}
            value={values.cooldownSeconds}
            onChange={(e) =>
              setValues({ ...values, cooldownSeconds: Number(e.target.value) || 0 })
            }
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-fg"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-fg-muted">
            Sensibilidade — {(values.sensitivity * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.05}
            value={values.sensitivity}
            onChange={(e) =>
              setValues({ ...values, sensitivity: Number(e.target.value) })
            }
            className="w-full accent-[var(--brand)]"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-fg-muted">
            Área mínima — {values.minAreaPct.toFixed(1)}% do frame
          </span>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={values.minAreaPct}
            onChange={(e) =>
              setValues({ ...values, minAreaPct: Number(e.target.value) })
            }
            className="w-full accent-[var(--brand)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted">Blur kernel</span>
          <input
            type="number"
            min={1}
            max={21}
            step={2}
            value={values.blurKernel}
            onChange={(e) => setValues({ ...values, blurKernel: Number(e.target.value) || 1 })}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted">Dilate iters</span>
          <input
            type="number"
            min={0}
            max={10}
            value={values.dilateIterations}
            onChange={(e) =>
              setValues({ ...values, dilateIterations: Number(e.target.value) || 0 })
            }
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-fg"
          />
        </label>
        <label className="col-span-2 flex items-center gap-2 text-fg">
          <input
            type="checkbox"
            checked={values.snapshotOnMotion}
            onChange={(e) => setValues({ ...values, snapshotOnMotion: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Capturar snapshot no evento de movimento
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={status === 'saving'}>
          {status === 'saving' ? 'Salvando...' : 'Salvar'}
        </Button>
        {message && (
          <span
            className={
              'text-xs ' + (status === 'error' ? 'text-accent' : 'text-brand')
            }
            role="status"
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
