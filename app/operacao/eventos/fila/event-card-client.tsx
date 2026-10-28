"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Ev = {
  id: string;
  occurredAt: string;
  snapshotUrl: string | null;
  motionScore: number | null;
  aiLabel: string | null;
  aiConfidence: number | null;
  status: string;
  classification: string | null;
  site: { id: string; name: string };
  camera: { id: string; name: string } | null;
  seenBy: { id: string; name: string } | null;
  classifiedBy: { id: string; name: string } | null;
};

const CLASSES = [
  { v: "pessoa", label: "Pessoa" },
  { v: "veiculo", label: "Veículo" },
  { v: "objeto", label: "Objeto" },
  { v: "desconhecido", label: "Desconhecido" },
];

const SEVS = ["baixa", "media", "alta", "critica"];

export function EventCardClient({ ev }: { ev: Ev }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"idle" | "discard" | "escalate">("idle");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("media");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const call = async (url: string, body?: unknown) => {
    setErr(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Falha na operação");
      return false;
    }
    return true;
  };

  const seen = () =>
    start(async () => {
      if (await call(`/api/events/${ev.id}/seen`)) router.refresh();
    });

  const classify = (c: string) =>
    start(async () => {
      if (await call(`/api/events/${ev.id}/classify`, { classification: c }))
        router.refresh();
    });

  const discard = () =>
    start(async () => {
      if (await call(`/api/events/${ev.id}/discard`, { reason })) {
        setMode("idle");
        setReason("");
        router.refresh();
      }
    });

  const escalate = () =>
    start(async () => {
      if (
        await call(`/api/events/${ev.id}/escalate`, {
          severity,
          title: title || `Evento em ${ev.camera?.name ?? ev.site.name}`,
        })
      ) {
        setMode("idle");
        setTitle("");
        router.refresh();
      }
    });

  const statusTone =
    ev.status === "escalado"
      ? "bg-danger/10 text-danger"
      : ev.status === "descartado"
      ? "bg-fg-muted/10 text-fg-muted"
      : ev.status === "classificado"
      ? "bg-brand/10 text-brand"
      : "bg-brand/5 text-brand";

  return (
    <div className="rounded-lg border border-border bg-surface p-4 transition-all duration-150 hover:bg-surface/70">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-32 w-full shrink-0 overflow-hidden rounded-md border border-border bg-bg sm:w-48">
          {ev.snapshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ev.snapshotUrl}
              alt={`Snapshot de ${ev.camera?.name ?? ev.site.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-fg-muted">
              Sem snapshot
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs ${statusTone}`}>
              {ev.status}
            </span>
            {ev.aiLabel && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                IA: {ev.aiLabel}
                {ev.aiConfidence != null
                  ? ` ${(ev.aiConfidence * 100).toFixed(0)}%`
                  : ""}
              </span>
            )}
            {ev.motionScore != null && (
              <span className="rounded-full bg-fg-muted/10 px-2 py-0.5 text-xs text-fg-muted">
                movimento {(ev.motionScore * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <p className="mt-2 font-display text-base text-fg">
            {ev.camera?.name ?? "Sensor"} · {ev.site.name}
          </p>
          <p className="text-xs text-fg-muted">
            {new Date(ev.occurredAt).toLocaleString("pt-BR")}
            {ev.seenBy ? ` · visto por ${ev.seenBy.name}` : ""}
            {ev.classifiedBy ? ` · classificado por ${ev.classifiedBy.name}` : ""}
          </p>

          {err && <p className="mt-2 text-xs text-accent">{err}</p>}

          {mode === "idle" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!ev.seenBy && (
                <Button size="sm" variant="ghost" onClick={seen} disabled={pending}>
                  Marcar visto
                </Button>
              )}
              {CLASSES.map((c) => (
                <Button
                  key={c.v}
                  size="sm"
                  variant={ev.classification === c.v ? "primary" : "secondary"}
                  onClick={() => classify(c.v)}
                  disabled={pending}
                >
                  {c.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMode("discard")}
                disabled={pending}
              >
                Descartar
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setMode("escalate")}
                disabled={pending}
              >
                Escalar
              </Button>
            </div>
          )}

          {mode === "discard" && (
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
                placeholder="Motivo do descarte (ex: animal, sombra, vento)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={discard} disabled={pending}>
                  Confirmar descarte
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {mode === "escalate" && (
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
                placeholder="Título do incidente"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  {SEVS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="primary" onClick={escalate} disabled={pending}>
                  Criar incidente
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
