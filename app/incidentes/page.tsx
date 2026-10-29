import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Incidentes | Plataforma de Monitoramento",
  description: "Incidentes escalados a partir de eventos, com trilha de auditoria completa.",
};

const SEVERITY_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const SEVERITY_TONE: Record<string, string> = {
  baixa: "bg-success/10 text-success",
  media: "bg-warning/10 text-warning",
  alta: "bg-warning/20 text-warning",
  critica: "bg-danger/10 text-danger",
};

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  resolvido: "Resolvido",
  arquivado: "Arquivado",
};

const STATUS_TONE: Record<string, string> = {
  aberto: "bg-danger/10 text-danger",
  em_analise: "bg-warning/10 text-warning",
  resolvido: "bg-success/10 text-success",
  arquivado: "bg-fg-muted/10 text-fg-muted",
};

export default async function IncidentesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; severity?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "user";
  if (!["admin", "operador"].includes(role)) redirect("/sem-permissao");

  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.severity) where.severity = sp.severity;

  const incidents = await prisma.incident.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      client: { select: { name: true } },
      site: { select: { name: true } },
      camera: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  const abertos = incidents.filter((i) => i.status === "aberto").length;
  const emAnalise = incidents.filter((i) => i.status === "em_analise").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-fg">Incidentes</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Eventos escalados pela Central de Operação, com trilha de auditoria completa.
          </p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Abertos</p>
            <p className="mt-1 font-display text-2xl text-danger">{abertos}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Em análise</p>
            <p className="mt-1 font-display text-2xl text-warning">{emAnalise}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Total</p>
            <p className="mt-1 font-display text-2xl text-fg">{incidents.length}</p>
          </CardBody>
        </Card>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" action="/incidentes">
        <div>
          <label className="block text-xs text-fg-muted">Status</label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Todos</option>
            <option value="aberto">Aberto</option>
            <option value="em_analise">Em análise</option>
            <option value="resolvido">Resolvido</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-fg-muted">Severidade</label>
          <select
            name="severity"
            defaultValue={sp.severity ?? ""}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Todas</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg transition-colors hover:bg-fg/5"
        >
          Filtrar
        </button>
      </form>

      <Card className="mt-6">
        <CardBody>
          {incidents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-fg-muted">Nenhum incidente encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="py-2 pr-3">Severidade</th>
                    <th className="py-2 pr-3">Título</th>
                    <th className="py-2 pr-3">Cliente / Site</th>
                    <th className="py-2 pr-3">Câmera</th>
                    <th className="py-2 pr-3">Responsável</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Aberto em</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_TONE[inc.severity] ?? "bg-fg-muted/10 text-fg-muted"}`}>
                          {SEVERITY_LABEL[inc.severity] ?? inc.severity}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-fg">
                        <Link href={`/incidentes/${inc.id}`} className="hover:underline">
                          {inc.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="text-fg">{inc.client.name}</p>
                        <p className="text-xs text-fg-muted">{inc.site.name}</p>
                      </td>
                      <td className="py-3 pr-3 text-fg-muted">{inc.camera?.name ?? "—"}</td>
                      <td className="py-3 pr-3 text-fg-muted">{inc.assignedTo?.name ?? "Não atribuído"}</td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[inc.status] ?? "bg-fg-muted/10 text-fg-muted"}`}>
                          {STATUS_LABEL[inc.status] ?? inc.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-fg-muted">
                        {new Date(inc.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
