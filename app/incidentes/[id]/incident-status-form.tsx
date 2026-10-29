"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "resolvido", label: "Resolvido" },
  { value: "arquivado", label: "Arquivado" },
];

export function IncidentStatusForm({
  incidentId,
  status,
  assignedToId,
  resolutionNotes,
  assignableUsers,
}: {
  incidentId: string;
  status: string;
  assignedToId: string | null;
  resolutionNotes: string;
  assignableUsers: { id: string; name: string | null }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    status,
    assignedToId: assignedToId ?? "",
    resolutionNotes,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar incidente");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar incidente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {error && <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-fg-muted">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-fg-muted">Atribuído a</label>
          <select
            value={form.assignedToId}
            onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Não atribuído</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.id}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-fg-muted">Notas de resolução</label>
        <textarea
          value={form.resolutionNotes}
          onChange={(e) => setForm((f) => ({ ...f, resolutionNotes: e.target.value }))}
          rows={3}
          placeholder="O que foi feito pra resolver — fica registrado na trilha de auditoria."
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted"
        />
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
