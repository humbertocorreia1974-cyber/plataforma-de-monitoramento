import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { FilaClient } from './fila-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Central de Operação | Plataforma de Monitoramento',
  description:
    'Fila de eventos em tempo real com workflow de classificação, descarte e escalada para incidente.',
  openGraph: {
    title: 'Central de Operação',
    description:
      'Fila de eventos em tempo real com workflow de classificação, descarte e escalada para incidente.',
    type: 'website',
  },
};

export default async function OperacaoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['operador', 'admin'].includes(role)) redirect('/');

  const userId = session.user.id;

  const allowedSites = await prisma.siteOperator.findMany({
    where: { userId },
    select: {
      site: {
        select: { id: true, name: true, code: true, client: { select: { name: true } } },
      },
    },
  });

  const siteIds = allowedSites.map((s) => s.site.id);

  const events = await prisma.event.findMany({
    where: {
      siteId: role === 'admin' ? undefined : { in: siteIds },
      status: { in: ['novo', 'em_analise'] },
    },
    orderBy: { occurredAt: 'desc' },
    take: 50,
    include: {
      site: { select: { id: true, name: true, code: true } },
      camera: { select: { id: true, name: true, code: true } },
    },
  });

  const sites = allowedSites.map((s) => ({
    id: s.site.id,
    name: s.site.name,
    code: s.site.code,
    clientName: s.site.client?.name ?? '',
  }));

  const initialEvents = events.map((e) => ({
    id: e.id,
    siteId: e.siteId,
    siteName: e.site?.name ?? '',
    siteCode: e.site?.code ?? '',
    cameraName: e.camera?.name ?? 'Sensor',
    occurredAt: e.occurredAt.toISOString(),
    snapshotUrl: e.snapshotUrl,
    motionScore: e.motionScore,
    aiLabel: e.aiLabel,
    aiConfidence: e.aiConfidence,
    status: e.status,
    classification: e.classification,
  }));

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
              Central de Operação
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Fila de eventos em tempo real · {sites.length} site(s) liberado(s) para você
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
            SSE conectado
          </span>
        </header>

        {sites.length === 0 ? (
          <Card>
            <CardBody>
              <CardTitle>Nenhum site liberado</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Seu perfil de operador ainda não tem sites atribuídos. Peça ao administrador
                para liberar o acesso em <span className="text-fg">Sites → Operadores</span>.
              </p>
            </CardBody>
          </Card>
        ) : (
          <FilaClient sites={sites} initialEvents={initialEvents} />
        )}
      </div>
    </main>
  );
}
