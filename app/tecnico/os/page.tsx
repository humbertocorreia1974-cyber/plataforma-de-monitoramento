import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Minhas Ordens de Serviço | App do Técnico",
  description:
    "App do técnico em campo: veja O.S. atribuídas, faça check-in no local, registre fotos antes/depois, colha assinatura do cliente e conclua o atendimento.",
  openGraph: {
    title: "Minhas Ordens de Serviço",
    description: "PWA do técnico para atendimento em campo.",
  },
};

const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  atribuida: "Atribuída",
  em_rota: "Em rota",
  em_atendimento: "Em atendimento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export default async function TecnicoOSPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role as string | undefined;
  if (role !== "tecnico" && role !== "admin") redirect("/");

  const technician = await prisma.technician.findUnique({
    where: { userId: session.user.id },
  });

  if (!technician && role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card>
          <CardBody>
            <CardTitle>Perfil de técnico não encontrado</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Sua conta ainda não tem um perfil de técnico vinculado. Fale com o
              administrador para habilitar seu acesso ao app de campo.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const where = role === "admin" ? {} : { technicianId: technician!.id };
  const orders = await prisma.serviceOrder.findMany({
    where,
    include: {
      site: { select: { name: true, address: true, city: true, state: true } },
      client: { select: { name: true } },
      technician: { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
    take: 60,
  });

  const abertas = orders.filter(
    (o) => o.status !== "concluida" && o.status !== "cancelada",
  );
  const concluidas = orders.filter((o) => o.status === "concluida");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">
            Minhas Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {technician?.user?.name
              ? `Olá, ${technician.user.name}.`
              : "Painel do técnico."}{" "}
            {abertas.length} O.S. em aberto.
          </p>
        </div>
        <Link href="/tecnico/os/nova">
          <Button variant="secondary" size="md">Abrir nova O.S.</Button>
        </Link>
      </header>

      {orders.length === 0 ? (
        <Card>
          <CardBody>
            <CardTitle>Nenhuma O.S. atribuída</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              Quando o operador atribuir uma ordem de serviço para você, ela
              aparece aqui com endereço, prioridade e ações de campo.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-display text-lg text-fg">Em aberto</h2>
            {abertas.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-sm text-fg-muted">
                    Nenhuma O.S. em aberto. Bom trabalho!
                  </p>
                </CardBody>
              </Card>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {abertas.map((o) => (
                  <li key={o.id}>
                    <Link href={`/tecnico/os/${o.id}`} className="block">
                      <Card className="transition-all duration-150 hover:bg-white/5">
                        <CardBody>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-fg-muted">{o.code}</p>
                              <p className="font-display text-base text-fg">
                                {o.title}
                              </p>
                            </div>
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                              {statusLabel[o.status] ?? o.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-fg-muted">
                            {o.client.name} · {o.site.name}
                          </p>
                          <p className="text-xs text-fg-muted">
                            {o.site.address ?? ""} {o.site.city ?? ""}{" "}
                            {o.site.state ?? ""}
                          </p>
                          <p className="mt-2 text-xs text-fg-muted">
                            Prioridade: {o.priority}
                          </p>
                        </CardBody>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {concluidas.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg text-fg">Concluídas</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {concluidas.map((o) => (
                  <li key={o.id}>
                    <Link href={`/tecnico/os/${o.id}`} className="block">
                      <Card className="opacity-80 transition-all duration-150 hover:bg-white/5">
                        <CardBody>
                          <p className="text-xs text-fg-muted">{o.code}</p>
                          <p className="font-display text-base text-fg">
                            {o.title}
                          </p>
                          <p className="mt-1 text-sm text-fg-muted">
                            {o.client.name} · {o.site.name}
                          </p>
                        </CardBody>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
