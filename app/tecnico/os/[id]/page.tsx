import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import ServiceOrderActions from "./service-order-actions-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const os = await prisma.serviceOrder.findUnique({
    where: { id },
    select: { code: true, title: true },
  });
  return {
    title: os ? `${os.code} — ${os.title}` : "Ordem de Serviço",
    description: "Detalhes da ordem de serviço em campo.",
  };
}

export default async function ServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role as string | undefined;

  const os = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      site: true,
      client: true,
      technician: { include: { user: { select: { name: true } } } },
      incident: { select: { id: true, title: true, severity: true } },
    },
  });

  if (!os) notFound();

  const technician = await prisma.technician.findUnique({
    where: { userId: session.user.id },
  });
  const isOwner = technician && os.technicianId === technician.id;
  if (role !== "admin" && !isOwner) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card>
          <CardBody>
            <CardTitle>Sem acesso</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Esta O.S. não está atribuída a você.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-fg-muted">{os.code}</p>
        <h1 className="font-display text-2xl font-semibold text-fg">{os.title}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {os.client.name} · {os.site.name}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <CardTitle>Descrição</CardTitle>
              <p className="mt-2 whitespace-pre-wrap text-sm text-fg-muted">
                {os.description ?? "Sem descrição."}
              </p>
              {os.incident && (
                <p className="mt-3 text-xs text-fg-muted">
                  Incidente vinculado: {os.incident.title} ({os.incident.severity})
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Local</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                {os.site.address ?? "Endereço não cadastrado"}
              </p>
              <p className="text-sm text-fg-muted">
                {os.site.city ?? ""} {os.site.state ?? ""} {os.site.zipCode ?? ""}
              </p>
              {os.site.latitude && os.site.longitude && (
                <p className="mt-2 text-xs text-fg-muted">
                  Coordenadas: {os.site.latitude.toFixed(5)},{" "}
                  {os.site.longitude.toFixed(5)}
                </p>
              )}
            </CardBody>
          </Card>

          <ServiceOrderActions
            orderId={os.id}
            status={os.status}
            checkInAt={os.checkInAt ? os.checkInAt.toISOString() : null}
            photoBeforeUrl={os.photoBeforeUrl}
            photoAfterUrl={os.photoAfterUrl}
            signatureUrl={os.signatureUrl}
          />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardBody>
              <CardTitle>Resumo</CardTitle>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Status</dt>
                  <dd className="text-fg">{os.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Prioridade</dt>
                  <dd className="text-fg">{os.priority}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Agendada</dt>
                  <dd className="text-fg">
                    {os.scheduledAt
                      ? new Date(os.scheduledAt).toLocaleString("pt-BR")
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Técnico</dt>
                  <dd className="text-fg">
                    {os.technician?.user.name ?? "—"}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
