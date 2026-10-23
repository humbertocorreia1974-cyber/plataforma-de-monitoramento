import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { ClientFormClient } from './client-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clientes | Plataforma de Monitoramento',
  description: 'Cadastro de clientes atendidos pela central de monitoramento.',
};

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['admin', 'operador'].includes(role)) redirect('/');

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { sites: { select: { id: true } } },
  });

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Clientes</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Cadastre o cliente antes de criar sites e câmeras — é o primeiro passo pra colocar a central no ar.
            </p>
          </div>
        </header>

        {role === 'admin' && (
          <div className="mb-6">
            <ClientFormClient />
          </div>
        )}

        {clients.length === 0 ? (
          <Card>
            <CardBody>
              <CardTitle>Nenhum cliente cadastrado</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Use o formulário acima para cadastrar o primeiro cliente. Depois disso você poderá
                criar sites (endereços) e câmeras vinculadas a ele.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clients.map((c) => (
              <Card key={c.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{c.name}</CardTitle>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">
                    {c.document ? `Doc.: ${c.document}` : 'Sem documento cadastrado'}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {c.sites.length} site(s) · {c.contactName || c.contactEmail || 'sem contato cadastrado'}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
