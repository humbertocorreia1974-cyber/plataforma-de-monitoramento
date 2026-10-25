import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MotionSimulator from "./motion-simulator-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pré-filtro de movimento | Plataforma de Monitoramento",
  description:
    "Ajuste o pré-filtro de movimento em CPU (OpenCV background subtraction) por câmera: só frames com movimento real seguem para inferência de IA.",
  openGraph: {
    title: "Pré-filtro de movimento em CPU",
    description:
      "Reduza custo de inferência processando apenas frames com movimento real.",
  },
};

export default async function MotionPrefilterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "operador") redirect("/sem-permissao");

  const cameras = await prisma.camera.findMany({
    where: { status: { not: "offline" } },
    include: {
      site: { select: { id: true, name: true, client: { select: { name: true } } } },
      detectionRules: { where: { enabled: true }, take: 1 },
    },
    orderBy: { name: "asc" },
    take: 40,
  });

  const total = cameras.length;
  const comRegra = cameras.filter((c) => c.detectionRules.length > 0).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">
            Pré-filtro de movimento (CPU)
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            O gateway do cliente roda background subtraction (OpenCV) localmente.
            Só quando há movimento real o snapshot é enviado para inferência
            self-hosted (CodeProject.AI). Ajuste sensibilidade e cooldown por câmera.
          </p>
        </div>
        <Link href="/cameras">
          <Button variant="secondary" size="md">Ver câmeras</Button>
        </Link>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Câmeras ativas</p>
            <p className="mt-1 font-display text-2xl text-fg">{total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Com regra ativa</p>
            <p className="mt-1 font-display text-2xl text-fg">{comRegra}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Economia estimada</p>
            <p className="mt-1 font-display text-2xl text-brand">
              {total > 0 ? `${Math.round((comRegra / total) * 92)}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-fg-muted">frames descartados antes da IA</p>
          </CardBody>
        </Card>
      </div>

      {cameras.length === 0 ? (
        <Card>
          <CardBody>
            <CardTitle>Nenhuma câmera disponível</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Cadastre uma câmera vinculada a um site para começar a configurar o
              pré-filtro de movimento.
            </p>
            <div className="mt-4">
              <Link href="/cameras">
                <Button variant="primary" size="md">Cadastrar câmera</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <MotionSimulator
          cameras={cameras.map((c) => ({
            id: c.id,
            name: c.name,
            siteName: c.site.name,
            clientName: c.site.client.name,
            sensitivity: c.detectionRules[0]?.sensitivity ?? 0.5,
            cooldownSeconds: c.detectionRules[0]?.cooldownSeconds ?? 30,
            hasRule: c.detectionRules.length > 0,
          }))}
        />
      )}
    </div>
  );
}
