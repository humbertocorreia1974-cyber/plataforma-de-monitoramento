"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClientOpt = { id: string; name: string };
type SiteOpt = { id: string; name: string; clientId: string };

export function ContratoFormClient({ clients, sites }: { clients: ClientOpt[]; sites: SiteOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");

  const sitesDoCliente = sites.filter((s) => s.clientId === clientId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      code: String(fd.get("code") || "").trim(),
      clientId: String(fd.get("clientId") || ""),
      siteId: String(fd.get("siteId") || "") || null,
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || "").trim() || null,
      monthlyValue: Number(fd.get("monthlyValue") || 0),
      billingCycle: String(fd.get("billingCycle") || "mensal"),
      startDate: String(fd.get("startDate") || ""),
      endDate: String(fd.get("endDate") || "") || null,
    };
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erro ao criar contrato");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        + Novo contrato
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg">
        <h3 className="font-display text-lg text-fg">Novo contrato</h3>
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input name="code" placeholder="Código (ex: CT-2025-001)" required />
          <Input name="title" placeholder="Título" required />
          <select
            name="clientId"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Selecione o cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="siteId" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
            <option value="">Sem site específico</option>
            {sitesDoCliente.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Input name="monthlyValue" type="number" step="0.01" min="0" placeholder="Valor mensal (R$)" required />
          <select name="billingCycle" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
          <Input name="startDate" type="date" required />
          <Input name="endDate" type="date" />
          <textarea
            name="description"
            placeholder="Descrição (opcional)"
            rows={2}
            className="col-span-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          />
          {error && <p className="col-span-full text-sm text-red-500">{error}</p>}
          <div className="col-span-full flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Salvando..." : "Criar contrato"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
