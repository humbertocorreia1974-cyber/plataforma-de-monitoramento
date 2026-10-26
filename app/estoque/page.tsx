import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InventoryRowActions from './inventory-row-actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Estoque de equipamentos | Plataforma de Monitoramento',
  description: 'Câmeras, sensores e DVRs com número de série, status comodato/vendido e vínculo ao Site do cliente.',
  openGraph: {
    title: 'Estoque de equipamentos',
    description: 'Gestão de ativos em comodato e vendidos, vinculados a Sites e câmeras monitoradas.',
  },
};

type SP = { q?: string; status?: string; ownership?: string; type?: string };

export default async function EstoquePage({ searchParams }: { searchParams: SP }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) redirect('/sem-permissao');

  const where: any = {};
  if (searchParams.q) {
    where.OR = [
      { serialNumber: { contains: searchParams.q, mode: 'insensitive' } },
      { manufacturer: { contains: searchParams.q, mode: 'insensitive' } },
      { model: { contains: searchParams.q, mode: 'insensitive' } },
    ];
  }
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.ownership) where.ownership = searchParams.ownership;
  if (searchParams.type) where.type = searchParams.type;

  const [items, clients, sites, cameras, sensors, counts] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        client: { select: { id: true, name: true } },
        site: { select: { id: true, name: true, code: true } },
        camera: { select: { id: true, name: true } },
        sensor: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.site.findMany({ select: { id: true, name: true, code: true, clientId: true }, orderBy: { name: 'asc' } }),
    prisma.camera.findMany({ select: { id: true, name: true, siteId: true }, orderBy: { name: 'asc' } }),
    prisma.sensor.findMany({ select: { id: true, name: true, siteId: true }, orderBy: { name: 'asc' } }),
    prisma.inventoryItem.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((a, c) => a + c._count._all, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">Estoque de equipamentos</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Ativos com número de série, comodato/vendido e vínculo ao Site monitorado.
          </p>
        </div>
        <Link href="/estoque/novo">
          <Button variant="primary" size="md">+ Novo equipamento</Button>
        </Link>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total" value={total} />
        <Stat label="Disponível" value={byStatus['disponivel'] ?? 0} />
        <Stat label="Instalado" value={byStatus['instalado'] ?? 0} />
        <Stat label="Manutenção" value={byStatus['manutencao'] ?? 0} />
        <Stat label="Baixado" value={byStatus['baixado'] ?? 0} />
      </div>

      <Card className="mb-6">
        <CardBody>
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-4" method="get">
            <Input name="q" placeholder="Serial, fabricante, modelo" defaultValue={searchParams.q ?? ''} />
            <select name="type" defaultValue={searchParams.type ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Todos os tipos</option>
              <option value="camera">Câmera</option>
              <option value="sensor">Sensor</option>
              <option value="dvr">DVR</option>
              <option value="nvr">NVR</option>
              <option value="outro">Outro</option>
            </select>
            <select name="status" defaultValue={searchParams.status ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Todos os status</option>
              <option value="disponivel">Disponível</option>
              <option value="instalado">Instalado</option>
              <option value="manutencao">Manutenção</option>
              <option value="baixado">Baixado</option>
            </select>
            <select name="ownership" defaultValue={searchParams.ownership ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Comodato ou vendido</option>
              <option value="comodato">Comodato</option>
              <option value="vendido">Vendido</option>
            </select>
            <div className="sm:col-span-4 flex gap-2">
              <Button type="submit" variant="primary" size="sm">Filtrar</Button>
              <Link href="/estoque"><Button type="button" variant="ghost" size="sm">Limpar</Button></Link>
            </div>
          </form>
        </CardBody>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <p className="text-fg-muted">Nenhum equipamento encontrado com esses filtros.</p>
              <Link href="/estoque/novo" className="mt-4 inline-block">
                <Button variant="primary" size="md">Cadastrar primeiro equipamento</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Serial</th>
                  <th className="px-4 py-3">Tipo / Modelo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Propriedade</th>
                  <th className="px-4 py-3">Cliente / Site</th>
                  <th className="px-4 py-3">Vínculo</th>
                  <th className="px-4 py-3">Garantia</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-fg">
                      <Link href={`/estoque/${it.id}`} className="hover:text-brand hover:underline">{it.serialNumber}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-fg">{it.type}</div>
                      <div className="text-xs text-fg-muted">{it.manufacturer ?? '—'} {it.model ?? ''}</div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={statusTone(it.status)}>{it.status}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={it.ownership === 'vendido' ? 'brand' : 'accent'}>{it.ownership}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="text-fg">{it.client?.name ?? '—'}</div>
                      <div className="text-xs text-fg-muted">{it.site ? `${it.site.name}${it.site.code ? ` (${it.site.code})` : ''}` : '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted">
                      {it.camera ? `📷 ${it.camera.name}` : it.sensor ? `📡 ${it.sensor.name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <WarrantyIndicator warrantyExpiresAt={it.warrantyExpiresAt} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <InventoryRowActions
                        item={{ id: it.id, serialNumber: it.serialNumber, status: it.status, ownership: it.ownership, clientId: it.clientId, siteId: it.siteId, cameraId: it.cameraId, sensorId: it.sensorId }}
                        clients={clients}
                        sites={sites}
                        cameras={cameras}
                        sensors={sensors}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-wide text-fg-muted">{label}</div>
        <div className="mt-1 font-display text-2xl font-semibold text-fg">{value}</div>
      </CardBody>
    </Card>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'brand' | 'accent' | 'muted' | 'danger' }) {
  const cls =
    tone === 'brand' ? 'bg-brand/10 text-brand' :
    tone === 'accent' ? 'bg-accent/10 text-accent' :
    tone === 'danger' ? 'bg-red-500/10 text-red-500' :
    'bg-fg/5 text-fg-muted';
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

function statusTone(s: string): 'brand' | 'accent' | 'muted' | 'danger' {
  if (s === 'instalado') return 'brand';
  if (s === 'disponivel') return 'accent';
  if (s === 'manutencao') return 'danger';
  return 'muted';
}

function WarrantyIndicator({ warrantyExpiresAt }: { warrantyExpiresAt: Date | null }) {
  if (!warrantyExpiresAt) return <span className="text-fg-muted">—</span>;
  const diffDays = Math.ceil((new Date(warrantyExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return <Badge tone="danger">vencida</Badge>;
  if (diffDays <= 30) return <Badge tone="danger">vence em {diffDays}d</Badge>;
  return <span className="text-fg-muted">{new Date(warrantyExpiresAt).toLocaleDateString('pt-BR')}</span>;
}
