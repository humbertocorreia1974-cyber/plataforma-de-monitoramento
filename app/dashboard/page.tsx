import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel · Plataforma de Monitoramento" };

const ATALHOS = [{"href":"/clientes","label":"Clientes"},{"href":"/sites","label":"Sites"},{"href":"/cameras","label":"Câmeras"},{"href":"/operacao","label":"Operação"},{"href":"/detection-rules","label":"Detection Rules"},{"href":"/motion-prefilter","label":"Motion Prefilter"},{"href":"/contratos","label":"Contratos"},{"href":"/estoque","label":"Estoque"}];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = (session.user as { role?: string }).role ?? "user";
  const atalhos = role === "user" ? [] : ATALHOS;
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, {user?.name ?? user?.email}</h1>
      <p className="mt-1 text-sm text-fg-muted">Bem-vindo de volta ao Plataforma de Monitoramento.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {atalhos.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="h-full transition-transform hover:-translate-y-1">
              <CardTitle className="text-base">{a.label}</CardTitle>
              <CardBody>Abrir {a.label.toLowerCase()}</CardBody>
            </Card>
          </Link>
        ))}
      </div>
      {atalhos.length === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-surface/60 p-6">
          <p className="font-medium">Seu acesso ainda está aguardando liberação</p>
          <p className="mt-1 text-sm text-fg-muted">Sua conta foi criada, mas ainda não tem um perfil de acesso. Peça ao administrador da sua empresa para definir seu perfil e os sites que você vai acompanhar.</p>
        </div>
      )}
    </main>
  );
}
