import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { EventQueueClient } from './event-queue-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Central de Operação — Fila de Eventos | Plataforma de Monitoramento',
  description:
    'Fila de eventos em tempo real com workflow de operador: visualizar, classificar, descartar ou escalar para incidente.',
  openGraph: {
    title: 'Central de Operação — Fila de Eventos',
    description:
      'Fila de eventos em tempo real com workflow de operador: visualizar, classificar, descartar ou escalar para incidente.',
    type: 'website',
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const role = session.user.role ?? 'user';
  if (!['admin', 'operador'].includes(role)) {
    redirect('/');
  }

  let allowed: string[] | null = null;
  if (role !== 'admin') {
    const rows = await prisma.siteOperator.findMany({
      where: { userId: session.user.id },
      select: { siteId: true },
    });
    allowed = rows.map((r) => r.siteId);
  }

  const where: Record<string, unknown> = {};
  if (allowed) {
    if (allowed.length === 0) {
      return (
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Card>
            <CardBody>
              <CardTitle>Sem sites liberados</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Seu perfil de operador ainda não tem sites atribuídos. Peça ao
                administrador para liberar acesso em <strong>Sites → Operadores</strong>.
              </p>
            </CardBody>
          </Card>
        </main>
      );
    }
    where.siteId = { in: allowed };
  }

  const [events, sites] = await Promise.all([
    prisma.event.findMany({
      where: { ...where, status: { in: ['novo', 'em_analise'] } },
      orderBy: { occurredAt: 'desc' },
      take: 60,
      include: {
        site: { select: { id: true, name: true, client: { select: { name: true } } } },
        camera: { select: { id: true, name: true } },
        detectionRule: { select: { id: true, name: true } },
      },
    }),
    prisma.site.findMany({
      where: allowed ? { id: { in: allowed } } : {},
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
            Central de Operação
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Fila em tempo real — visualize, classifique, descarte ou escale para incidente.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" aria-hidden />
          SSE conectado
        </span>
      </header>

      <EventQueueClient
        initialEvents={JSON.parse(JSON.stringify(events))}
        sites={sites}
      />
    </main>
  );
}
