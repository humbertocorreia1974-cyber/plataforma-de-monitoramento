import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { IncidentStatusForm } from "./incident-status-form";

export const dynamic = "force-dynamic";

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

export default async function IncidenteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "user";
  if (!["admin", "operador"].includes(role)) redirect("/sem-permissao");

  const { id } = await params;
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      site: { select: { name: true } },
      camera: { select: { name: true } },
      reportedBy: { select: { name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
  if (!incident) notFound();

  const assignableUsers = await prisma.user.findMany({
    where: { role: { in: ["admin", "operador"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { incidentId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, action: true, actorRole: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/incidentes" className="text-xs text-brand hover:underline">
        ← Voltar para incidentes
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_TONE[incident.severity] ?? "bg-fg-muted/10 text-fg-muted"}`}>
            {SEVERITY_LABEL[incident.severity] ?? incident.severity}
          </span>
          <h1 className="mt-2 font-display text-2xl text-fg">{incident.title}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {incident.client.name} · {incident.site.name}
            {incident.camera ? ` · ${incident.camera.name}` : ""}
          </p>
        </div>
      </header>

      {incident.description && (
        <Card className="mt-6">
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Descrição</p>
            <p className="mt-2 text-sm text-fg">{incident.description}</p>
          </CardBody>
        </Card>
      )}

      {incident.snapshotUrl && (
        <Card className="mt-6 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={incident.snapshotUrl} alt="Snapshot do evento que originou o incidente" className="w-full object-cover" />
        </Card>
      )}

      <Card className="mt-6">
        <CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Detalhes</p>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-fg-muted">Reportado por</dt>
              <dd className="text-fg">{incident.reportedBy?.name ?? "Sistema"}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted">Aberto em</dt>
              <dd className="text-fg">{new Date(incident.createdAt).toLocaleString("pt-BR")}</dd>
            </div>
            {incident.resolvedAt && (
              <div>
                <dt className="text-xs text-fg-muted">Resolvido em</dt>
                <dd className="text-fg">{new Date(incident.resolvedAt).toLocaleString("pt-BR")}</dd>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Triagem</p>
          <IncidentStatusForm
            incidentId={incident.id}
            status={incident.status}
            assignedToId={incident.assignedTo?.id ?? null}
            resolutionNotes={incident.resolutionNotes ?? ""}
            assignableUsers={assignableUsers}
          />
        </CardBody>
      </Card>

      {auditLogs.length > 0 && (
        <Card className="mt-6">
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Trilha de auditoria</p>
            <ul className="mt-3 space-y-2 text-sm">
              {auditLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 text-fg-muted">
                  <span>
                    <span className="text-fg">{log.action}</span> por {log.actorRole ?? "sistema"}
                  </span>
                  <span className="text-xs">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
