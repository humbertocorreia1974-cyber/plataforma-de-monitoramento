"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContratoStatusClient({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function change(newStatus: string) {
    setLoading(true);
    await fetch(`/api/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => change(e.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg disabled:opacity-50"
    >
      <option value="ativo">Ativo</option>
      <option value="suspenso">Suspenso</option>
      <option value="encerrado">Encerrado</option>
    </select>
  );
}
