import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventQueueLive from "./event-queue-live";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fila de eventos em tempo real | Central de Operação",
  description:
    "Fila multi-câmera em tempo real com classificação, descarte e escalada para incidente.",
  openGraph: {
    title: "Fila de eventos em tempo real",
    description:
      "Central de operação com fila SSE, classificação de eventos e escalada para incidente.",
  },
  alternates: { canonical: "/operacao/eventos/fila" },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role;
  if (role !== "operador" && role !== "admin") redirect("/");

  // Sites visíveis para o operador (isolamento multi-tenant)
  let sites: { id: string; name: string; clientName: string }[] = [];
  if (role === "admin") {
    const rows = await prisma.site.findMany({
      orderBy: { name: "asc" },
      include: { client: { select: { name: true } } },
    });
    sites = rows.map((s) => ({ id: s.id, name: s.name, clientName: s.client.name }));
  } else {
    const rows = await prisma.siteOperator.findMany({
      where: { userId: session.user.id },
      include: { site: { include: { client: { select: { name: true } } } } },
    });
    sites = rows.map((r) => ({
      id: r.site.id,
      name: r.site.name,
      clientName: r.site.client.name,
    }));
  }

  const initial = await prisma.event.findMany({
    where: sites.length ? { siteId: { in: sites.map((s) => s.id) } } : { id: "__none__" },
    orderBy: { occurredAt: "desc" },
    take: 50,
    include: {
      site: { select: { id: true, name: true, client: { select: { name: true } } } },
      camera: { select: { id: true, name: true } },
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-fg-muted">Central de Operação</p>
          <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
            Fila de eventos em tempo real
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            Eventos chegam por SSE assim que o gateway do cliente envia o snapshot. Fluxo do
            operador: visualizar → classificar → descartar ou escalar para incidente.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/operacao/eventos">
            <Button variant="secondary" size="sm">
              Histórico
            </Button>
          </Link>
          <Link href="/incidentes">
            <Button variant="secondary" size="sm">
              Incidentes
            </Button>
          </Link>
        </div>
      </header>

      {sites.length === 0 ? (
        <Card>
          <CardBody>
            <CardTitle>Nenhum site liberado</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Seu perfil de operador ainda não tem sites atribuídos. Peça ao administrador para
              liberar o acesso em <span className="text-fg">Sites → Operadores</span>.
            </p>
          </CardBody>
        </Card>
      ) : (
        <EventQueueLive
          sites={sites}
          initialEvents={initial.map((e) => ({
            id: e.id,
            occurredAt: e.occurredAt.toISOString(),
            status: e.status,
            classification: e.classification,
            aiLabel: e.aiLabel,
            aiConfidence: e.aiConfidence,
            motionScore: e.motionScore,
            snapshotUrl: e.snapshotUrl,
            siteName: e.site.name,
            clientName: e.site.client.name,
            cameraName: e.camera?.name ?? "—",
          }))}
        />
      )}
    </main>
  );
}
