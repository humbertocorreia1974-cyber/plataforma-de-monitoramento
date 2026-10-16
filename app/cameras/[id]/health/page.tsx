import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HealthCheckButton from "./health-check-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Health-check da câmera | Plataforma de Monitoramento",
  description:
    "Histórico de checagens online/offline e latência da câmera, com alerta antes do cliente reclamar.",
  openGraph: {
    title: "Health-check da câmera",
    description: "Status, latência e histórico de checagens em tempo real.",
  },
};

function badge(status: string) {
  const map: Record<string, string> = {
    online: "bg-brand/10 text-brand",
    degradada: "bg-accent/10 text-accent",
    offline: "bg-red-500/10 text-red-500",
    ok: "bg-brand/10 text-brand",
    warn: "bg-accent/10 text-accent",
    fail: "bg-red-500/10 text-red-500",
    unknown: "bg-fg-muted/10 text-fg-muted",
  };
  return map[status] ?? "bg-fg-muted/10 text-fg-muted";
}

export default async function CameraHealthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "user";
  const { id } = await params;

  const camera = await prisma.camera.findUnique({
    where: { id },
    include: { site: { include: { client: true } } },
  });
  if (!camera) notFound();

  if (role !== "admin") {
    const link = await prisma.siteOperator.findUnique({
      where: { siteId_userId: { siteId: camera.siteId, userId: session.user.id } },
    });
    if (!link) redirect("/operacao");
  }

  const checks = await prisma.cameraHealthCheck.findMany({
    where: { cameraId: id },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });

  const canRun = role === "admin" || role === "operador";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">
            {camera.site.client.name} · {camera.site.name}
          </p>
          <h1 className="font-display text-2xl font-semibold text-fg">
            Health-check · {camera.name}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {camera.manufacturer ?? "—"} {camera.model ?? ""} · S/N {camera.serialNumber ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge(camera.status)}`}>
            {camera.status}
          </span>
          {camera.lastLatencyMs != null && (
            <span className="rounded-full bg-fg-muted/10 px-3 py-1 text-xs text-fg-muted">
              {camera.lastLatencyMs}ms
            </span>
          )}
          <Link href="/cameras">
            <Button variant="ghost" size="sm">Voltar</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Executar checagem agora</CardTitle>
            <p className="mt-1 text-sm text-fg-muted">
              Consulta o endpoint ONVIF/RTSP configurado e registra o resultado na trilha de auditoria.
            </p>
          </div>
          {canRun ? (
            <HealthCheckButton cameraId={camera.id} />
          ) : (
            <span className="text-xs text-fg-muted">Somente operador/admin</span>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle className="text-base">Histórico de checagens</CardTitle>
          {checks.length === 0 ? (
            <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center">
              <p className="text-sm text-fg-muted">
                Nenhuma checagem registrada ainda. Rode a primeira para começar a monitorar latência.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="py-2 pr-4">Quando</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Latência</th>
                    <th className="py-2">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 text-fg-muted">
                        {new Date(c.checkedAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${badge(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-fg">{c.latencyMs ?? "—"}ms</td>
                      <td className="py-2 text-fg-muted">{c.message ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
