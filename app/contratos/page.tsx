import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { ContratoFormClient } from "./contrato-form-client";
import { ContratoStatusClient } from "./contrato-status-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contratos | Plataforma de Monitoramento",
  description: "Gestão de contratos com valor de mensalidade vinculado à assinatura do cliente.",
  openGraph: {
    title: "Contratos | Plataforma de Monitoramento",
    description: "Gestão de contratos e mensalidades por cliente.",
  },
};

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
};

function fmtBRL(v: unknown) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clientId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "admin" && role !== "cliente") redirect("/sem-permissao");

  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.clientId) where.clientId = sp.clientId;
  if (role === "cliente") where.clientId = session.user.clientId ?? "__none__";

  const [contracts, clients, sites] = await Promise.all([
    prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        subscriptions: { select: { id: true, plan: true, status: true, monthlyValue: true, sitesCount: true, camerasCount: true } },
      },
    }),
    role === "admin" ? prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    role === "admin" ? prisma.site.findMany({ select: { id: true, name: true, clientId: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);

  const totalMensal = contracts
    .filter((c) => c.status === "ativo")
    .reduce((acc, c) => acc + Number(c.monthlyValue), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-fg">Contratos</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Mensalidade por cliente e site. Valor vinculado à assinatura ativa.
          </p>
        </div>
        {role === "admin" && <ContratoFormClient clients={clients} sites={sites} />}
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Contratos ativos</p>
            <p className="mt-1 font-display text-2xl text-fg">
              {contracts.filter((c) => c.status === "ativo").length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">MRR contratado</p>
            <p className="mt-1 font-display text-2xl text-brand">{fmtBRL(totalMensal)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Total de contratos</p>
            <p className="mt-1 font-display text-2xl text-fg">{contracts.length}</p>
          </CardBody>
        </Card>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" action="/contratos">
        <div>
          <label className="block text-xs text-fg-muted">Status</label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
        {role === "admin" && (
          <div>
            <label className="block text-xs text-fg-muted">Cliente</label>
            <select
              name="clientId"
              defaultValue={sp.clientId ?? ""}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="">Todos</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg transition-colors hover:bg-white/5"
        >
          Filtrar
        </button>
      </form>

      <Card className="mt-6">
        <CardBody>
          {contracts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-fg-muted">Nenhum contrato encontrado com esses filtros.</p>
              {role === "admin" && (
                <p className="mt-2 text-xs text-fg-muted">Use o botão “+ Novo contrato” para cadastrar o primeiro.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="py-2 pr-3">Código</th>
                    <th className="py-2 pr-3">Cliente / Site</th>
                    <th className="py-2 pr-3">Título</th>
                    <th className="py-2 pr-3">Mensalidade</th>
                    <th className="py-2 pr-3">Assinatura</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => {
                    const sub = c.subscriptions[0];
                    return (
                      <tr key={c.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-3 font-mono text-xs text-fg-muted">{c.code}</td>
                        <td className="py-3 pr-3">
                          <p className="text-fg">{c.client.name}</p>
                          {c.site && <p className="text-xs text-fg-muted">{c.site.name}</p>}
                        </td>
                        <td className="py-3 pr-3 text-fg">{c.title}</td>
                        <td className="py-3 pr-3 text-brand">{fmtBRL(c.monthlyValue)}</td>
                        <td className="py-3 pr-3">
                          {sub ? (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                              {sub.plan} · {sub.sitesCount} sites · {sub.camerasCount} câmeras
                            </span>
                          ) : (
                            <span className="text-xs text-fg-muted">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          {role === "admin" ? (
                            <ContratoStatusClient id={c.id} status={c.status} />
                          ) : (
                            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-fg-muted">
                              {STATUS_LABEL[c.status] ?? c.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
