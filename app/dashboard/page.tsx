import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel · Plataforma de Monitoramento" };

const ATALHOS = [{"href":"/operacao","label":"Operação"},{"href":"/detection-rules","label":"Detection Rules"},{"href":"/motion-prefilter","label":"Motion Prefilter"},{"href":"/contratos","label":"Contratos"},{"href":"/estoque","label":"Estoque"}];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, {user?.name ?? user?.email}</h1>
      <p className="mt-1 text-sm text-fg-muted">Bem-vindo de volta ao Plataforma de Monitoramento.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ATALHOS.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="h-full transition-transform hover:-translate-y-1">
              <CardTitle className="text-base">{a.label}</CardTitle>
              <CardBody>Abrir {a.label.toLowerCase()}</CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
