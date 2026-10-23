import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { SiteFormClient } from './site-form';
import { OperatorFormClient } from './operator-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sites | Plataforma de Monitoramento',
  description: 'Endereços monitorados de cada cliente, com câmeras e operadores liberados.',
};

export default async function SitesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['admin', 'operador'].includes(role)) redirect('/');

  const [clients, sites] = await Promise.all([
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.site.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true } },
        cameras: { select: { id: true } },
        operators: { include: { user: { select: { name: true, email: true } } } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Sites</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Endereço monitorado de um cliente. Cadastre o site antes de adicionar câmeras, e
              libere operadores aqui — é o que a tela de Operação pede quando diz "Sites → Operadores".
            </p>
          </div>
        </header>

        {clients.length === 0 ? (
          <Card>
            <CardBody>
              <CardTitle>Cadastre um cliente primeiro</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Um site sempre pertence a um cliente. Vá em{' '}
                <a href="/clientes" className="text-brand hover:underline">Clientes</a> e cadastre o
                primeiro antes de criar um site.
              </p>
            </CardBody>
          </Card>
        ) : (
          role === 'admin' && (
            <div className="mb-6">
              <SiteFormClient clients={clients} />
            </div>
          )
        )}

        {sites.length === 0 ? (
          <Card>
            <CardBody>
              <CardTitle>Nenhum site cadastrado</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Depois de cadastrar um site você poderá adicionar câmeras e liberar operadores pra ele.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sites.map((s) => (
              <Card key={s.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>{s.name}{s.code ? ` (${s.code})` : ''}</CardTitle>
                      <p className="mt-1 text-sm text-fg-muted">{s.client.name}</p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
                      {s.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">
                    {s.cameras.length} câmera(s) · {s.operators.length} operador(es) liberado(s)
                  </p>
                  {s.operators.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {s.operators.map((op) => (
                        <li key={op.id} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">
                          {op.user.name || op.user.email}
                        </li>
                      ))}
                    </ul>
                  )}
                  {role === 'admin' && (
                    <div className="mt-4 border-t border-border pt-4">
                      <OperatorFormClient siteId={s.id} />
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
