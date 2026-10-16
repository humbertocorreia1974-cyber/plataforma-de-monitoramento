"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cam = {
  id: string;
  name: string;
  siteName: string;
  clientName: string;
  sensitivity: number;
  cooldownSeconds: number;
  hasRule: boolean;
};

export default function MotionSimulator({ cameras }: { cameras: Cam[] }) {
  const [selectedId, setSelectedId] = useState(cameras[0]?.id ?? "");
  const selected = useMemo(
    () => cameras.find((c) => c.id === selectedId) ?? cameras[0],
    [cameras, selectedId],
  );

  const [sensitivity, setSensitivity] = useState(selected?.sensitivity ?? 0.5);
  const [cooldown, setCooldown] = useState(selected?.cooldownSeconds ?? 30);
  const [motionScore, setMotionScore] = useState(0.42);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const threshold = 1 - sensitivity;
  const passes = motionScore >= threshold;
  const framesPerMin = 60 * 30;
  const framesAfter = passes ? framesPerMin : 0;

  function pick(id: string) {
    setSelectedId(id);
    const c = cameras.find((x) => x.id === id);
    if (c) {
      setSensitivity(c.sensitivity);
      setCooldown(c.cooldownSeconds);
    }
    setFeedback(null);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/motion-prefilter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraId: selected.id,
          sensitivity,
          cooldownSeconds: cooldown,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha ao salvar");
      setFeedback("Configuração salva e aplicada ao gateway.");
    } catch (e: any) {
      setFeedback(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardBody>
          <CardTitle>Câmeras</CardTitle>
          <ul className="mt-3 max-h-[520px] space-y-1 overflow-auto pr-1">
            {cameras.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick(c.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-all duration-150 ${
                    c.id === selected?.id
                      ? "border-brand bg-brand/10 text-fg"
                      : "border-border bg-surface/60 text-fg-muted hover:bg-white/5"
                  }`}
                >
                  <span className="block font-medium text-fg">{c.name}</span>
                  <span className="block text-xs text-fg-muted">
                    {c.clientName} · {c.siteName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardBody>
            <CardTitle>Simulador de background subtraction</CardTitle>
            <p className="mt-1 text-sm text-fg-muted">
              Ajuste o score de movimento observado e veja se o frame passaria o
              pré-filtro antes de chamar a IA.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-fg-muted">
                  Sensibilidade ({sensitivity.toFixed(2)})
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={0.95}
                  step={0.05}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="mt-2 w-full accent-[color:var(--brand)]"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-fg-muted">
                  Cooldown (segundos)
                </span>
                <Input
                  type="number"
                  min={5}
                  max={600}
                  value={cooldown}
                  onChange={(e) => setCooldown(parseInt(e.target.value || "0", 10))}
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-wide text-fg-muted">
                Motion score do frame ({motionScore.toFixed(2)})
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={motionScore}
                onChange={(e) => setMotionScore(parseFloat(e.target.value))}
                className="mt-2 w-full accent-[color:var(--brand)]"
              />
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-surface/60 p-3">
                <p className="text-xs text-fg-muted">Threshold</p>
                <p className="font-display text-lg text-fg">{threshold.toFixed(2)}</p>
              </div>
              <div className="rounded-md border border-border bg-surface/60 p-3">
                <p className="text-xs text-fg-muted">Decisão</p>
                <p
                  className={`font-display text-lg ${
                    passes ? "text-brand" : "text-fg-muted"
                  }`}
                >
                  {passes ? "Enviar p/ IA" : "Descartar"}
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface/60 p-3">
                <p className="text-xs text-fg-muted">Frames/min p/ IA</p>
                <p className="font-display text-lg text-fg">{framesAfter}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button variant="primary" size="md" onClick={save} disabled={saving}>
                {saving ? "Salvando..." : "Salvar configuração"}
              </Button>
              {feedback && (
                <span className="text-sm text-fg-muted">{feedback}</span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Como funciona no gateway</CardTitle>
            <ol className="mt-3 space-y-2 text-sm text-fg-muted">
              <li>1. Gateway abre o stream RTSP local (sem enviar vídeo 24/7).</li>
              <li>
                2. A cada N ms, aplica <code className="text-fg">cv2.createBackgroundSubtractorMOG2</code>{" "}
                e calcula a razão de pixels em movimento.
              </li>
              <li>
                3. Se a razão ≥ threshold, captura o snapshot e faz POST em{" "}
                <code className="text-fg">/api/events/ingest</code>.
              </li>
              <li>
                4. O servidor então chama o CodeProject.AI em{" "}
                <code className="text-fg">/v1/vision/detection</code>.
              </li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
