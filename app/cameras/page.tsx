import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { CameraFormClient } from './camera-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Câmeras | Plataforma de Monitoramento',
  description: 'Cadastro de câmeras por site, com status e saúde de conexão.',
};

const STATUS_LABEL: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  degradada: 'Degradada',
  manutencao: 'Manutenção',
};

const STATUS_TONE: Record<string, string> = {
  online: 'bg-success/10 text-success',
  offline: 'bg-danger/10 text-danger',
  degradada: 'bg-warning/10 text-warning',
  manutencao: 'bg-fg-muted/10 text-fg-muted',
};

const HEALTH_LABEL: Record<string, string> = {
  unknown: 'Nunca verificada',
  ok: 'OK',
  warn: 'Atenção',
  fail: 'Falha',
};

const HEALTH_TONE: Record<string, string> = {
  unknown: 'text-fg-muted',
  ok: 'text-success',
  warn: 'text-warning',
  fail: 'text-danger',
};

export default async function CamerasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['admin', 'operador'].includes(role)) redirect('/');

  const [sites, cameras] = await Promise.all([
    prisma.site.findMany({
      select: { id: true, name: true, code: true, client: { select: { name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.camera.findMany({
      orderBy: { createdAt: 'desc' },
      include: { site: { select: { name: true, client: { select: { name: true } } } } },
    }),
  ]);

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Câmeras</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Cadastre a câmera no site certo pra ela aparecer nas regras de detecção e na fila de
              operação.
            </p>
          </div>
        </header>

        {sites.length === 0 ? (
          <Card>
            <CardBody>
              <CardTitle>Cadastre um site primeiro</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Toda câmera pertence a um site. Vá em{' '}
                <a href="/sites" className="text-brand hover:underline">Sites</a> e cadastre o
                primeiro antes de adicionar uma câmera.
              </p>
            </CardBody>
          </Card>
        ) : (
          role === 'admin' && (
            <div className="mb-6">
              <CameraFormClient sites={sites} />
            </div>
          )
        )}

        {cameras.length === 0 ? (
          <Card>
            <CardBody>
              <CardTitle>Nenhuma câmera cadastrada</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Depois de cadastrada, a câmera passa a aparecer em Detection Rules, Motion Prefilter
                e na fila de Operação.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cameras.map((c) => (
              <Card key={c.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{c.name}</CardTitle>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[c.status] ?? 'bg-fg-muted/10 text-fg-muted'}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">
                    {c.site.client.name} · {c.site.name}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {c.manufacturer || 'Fabricante não informado'} {c.model || ''}
                  </p>
                  {!c.rtspUrl && !c.onvifUrl && (
                    <p className="mt-1 text-xs text-danger">Sem URL RTSP/ONVIF configurada — não é possível conectar.</p>
                  )}
                  <Link
                    href={`/cameras/${c.id}/health`}
                    className={`mt-3 inline-block text-sm hover:underline ${HEALTH_TONE[c.healthStatus] ?? 'text-fg-muted'}`}
                  >
                    Saúde da conexão: {HEALTH_LABEL[c.healthStatus] ?? c.healthStatus} →
                  </Link>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
