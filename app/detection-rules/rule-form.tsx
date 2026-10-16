"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CameraOpt = { id: string; label: string };

export default function RuleForm({ cameras }: { cameras: CameraOpt[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      cameraId: String(fd.get("cameraId") ?? ""),
      name: String(fd.get("name") ?? "").trim(),
      scheduleStart: String(fd.get("scheduleStart") ?? "").trim() || null,
      scheduleEnd: String(fd.get("scheduleEnd") ?? "").trim() || null,
      daysOfWeek: String(fd.get("daysOfWeek") ?? "").trim() || null,
      sensitivity: Number(fd.get("sensitivity") ?? 0.5),
      minConfidence: Number(fd.get("minConfidence") ?? 0.5),
      cooldownSeconds: Number(fd.get("cooldownSeconds") ?? 30),
      objectClasses: String(fd.get("objectClasses") ?? "").trim() || null,
      enabled: fd.get("enabled") === "on",
    };
    if (!payload.cameraId || !payload.name) {
      setError("Selecione a câmera e informe o nome da regra.");
      return;
    }
    const res = await fetch("/api/detection-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Falha ao criar regra");
      return;
    }
    setOk("Regra criada com sucesso.");
    (e.target as HTMLFormElement).reset();
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardBody>
        <CardTitle className="text-base">Nova regra</CardTitle>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">Câmera</label>
            <select
              name="cameraId"
              required
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="">Selecione…</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">Nome</label>
            <Input name="name" placeholder="Ex: Perímetro noturno" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">Início</label>
              <Input name="scheduleStart" placeholder="18:00" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">Fim</label>
              <Input name="scheduleEnd" placeholder="06:00" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">
              Dias (1=seg … 7=dom)
            </label>
            <Input name="daysOfWeek" placeholder="1,2,3,4,5" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">Sens.</label>
              <Input name="sensitivity" type="number" step="0.05" min="0" max="1" defaultValue="0.5" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">Conf.</label>
              <Input name="minConfidence" type="number" step="0.05" min="0" max="1" defaultValue="0.5" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">Cooldown</label>
              <Input name="cooldownSeconds" type="number" min="0" defaultValue="30" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">
              Classes (pessoa,veiculo,objeto)
            </label>
            <Input name="objectClasses" placeholder="pessoa,veiculo" />
          </div>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input type="checkbox" name="enabled" defaultChecked className="h-4 w-4" />
            Regra ativa
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {ok && <p className="text-xs text-brand">{ok}</p>}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Salvando..." : "Criar regra"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
