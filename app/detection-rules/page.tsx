import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RuleForm from "./rule-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Regras de detecção | Plataforma de Monitoramento",
  description:
    "Configure zona, horário, sensibilidade e classe de objeto por câmera para reduzir falsos positivos na análise de IA.",
  openGraph: {
    title: "Regras de detecção por câmera",
    description: "Zona, horário, sensibilidade e classe de objeto — por câmera.",
  },
};

export default async function DetectionRulesPage({
  searchParams,
}: {
  searchParams: Promise<{ cameraId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "user";
  if (role !== "admin" && role !== "operador") redirect("/sem-permissao");

  const { cameraId } = await searchParams;

  // Câmeras acessíveis
  let cameras;
  if (role === "admin") {
    cameras = await prisma.camera.findMany({
      include: { site: { select: { name: true, client: { select: { name: true } } } } },
      orderBy: { name: "asc" },
    });
  } else {
    const allowed = await prisma.siteOperator.findMany({
      where: { userId: session.user.id },
      select: { siteId: true },
    });
    cameras = await prisma.camera.findMany({
      where: { siteId: { in: allowed.map((a) => a.siteId) } },
      include: { site: { select: { name: true, client: { select: { name: true } } } } },
      orderBy: { name: "asc" },
    });
  }

  const rules = await prisma.detectionRule.findMany({
    where: cameraId ? { cameraId } : { cameraId: { in: cameras.map((c) => c.id) } },
    include: { camera: { select: { name: true, site: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">Regras de detecção</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Defina zona, horário, sensibilidade e classe de objeto por câmera. Regras ativas reduzem falsos positivos antes da inferência.
          </p>
        </div>
        <Link href="/operacao">
          <Button variant="ghost" size="sm">Ir para operação</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">
                Filtrar por câmera
              </label>
              <select
                name="cameraId"
                defaultValue={cameraId ?? ""}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="">Todas as câmeras</option>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.site.client.name} · {c.site.name} · {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" size="sm">Aplicar</Button>
          </form>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardBody>
            <CardTitle className="text-base">Regras cadastradas</CardTitle>
            {rules.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border p-8 text-center">
                <p className="text-sm text-fg-muted">
                  Nenhuma regra de detecção ainda. Crie a primeira ao lado para começar a filtrar eventos.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                      <th className="py-2 pr-4">Nome</th>
                      <th className="py-2 pr-4">Câmera</th>
                      <th className="py-2 pr-4">Horário</th>
                      <th className="py-2 pr-4">Sens.</th>
                      <th className="py-2 pr-4">Classes</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-4 font-medium text-fg">{r.name}</td>
                        <td className="py-2 pr-4 text-fg-muted">
                          {r.camera.site.name} · {r.camera.name}
                        </td>
                        <td className="py-2 pr-4 text-fg-muted">
                          {r.scheduleStart && r.scheduleEnd
                            ? `${r.scheduleStart}–${r.scheduleEnd}`
                            : "24h"}
                        </td>
                        <td className="py-2 pr-4 text-fg">{r.sensitivity.toFixed(2)}</td>
                        <td className="py-2 pr-4 text-fg-muted">{r.objectClasses ?? "todas"}</td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              r.enabled
                                ? "bg-brand/10 text-brand"
                                : "bg-fg-muted/10 text-fg-muted"
                            }`}
                          >
                            {r.enabled ? "ativa" : "inativa"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <RuleForm cameras={cameras.map((c) => ({
          id: c.id,
          label: `${c.site.client.name} · ${c.site.name} · ${c.name}`,
        }))} />
      </div>
    </main>
  );
}
