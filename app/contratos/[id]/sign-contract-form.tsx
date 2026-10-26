'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignContractForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawnRef.current = true;
  }

  function end() {
    drawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!signerName.trim()) {
      setError('Informe o nome de quem está assinando');
      return;
    }
    if (!hasDrawnRef.current) {
      setError('Desenhe a assinatura no quadro antes de confirmar');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');

    setSaving(true);
    const res = await fetch(`/api/contracts/${contractId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signerName, signerDocument: signerDocument || null, signatureData }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Falha ao registrar assinatura');
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-fg-muted">
          Nome de quem assina *
          <Input required value={signerName} onChange={(e) => setSignerName(e.target.value)} className="mt-1" placeholder="Nome completo" />
        </label>
        <label className="text-xs text-fg-muted">
          CPF/CNPJ
          <Input value={signerDocument} onChange={(e) => setSignerDocument(e.target.value)} className="mt-1" placeholder="000.000.000-00" />
        </label>
      </div>

      <div>
        <p className="mb-1 text-xs text-fg-muted">Assine com o dedo ou mouse no quadro abaixo</p>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="w-full touch-none rounded-md border border-border bg-white"
          style={{ maxWidth: '600px', height: '160px' }}
        />
        <div className="mt-2">
          <Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>Limpar assinatura</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="md" disabled={saving}>{saving ? 'Confirmando…' : 'Confirmar assinatura do contrato'}</Button>
      </div>
    </form>
  );
}
