"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function HealthCheckButton({ cameraId }: { cameraId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setMsg(null);
    const res = await fetch(`/api/cameras/${cameraId}/health-check`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "Falha ao checar");
      return;
    }
    setMsg(`Resultado: ${data.health?.status ?? "ok"}`);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-fg-muted">{msg}</span>}
      <Button onClick={run} disabled={pending} size="sm">
        {pending ? "Checando..." : "Rodar health-check"}
      </Button>
    </div>
  );
}
