import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody } from '@/components/ui/card';
import AddMaintenanceForm from './add-maintenance-form';

export const dynamic = 'force-dynamic';

function formatDate(d: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatMoney(v: unknown) {
  if (v == null) return '—';
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function warrantyBadge(warrantyExpiresAt: Date | null) {
  if (!warrantyExpiresAt) return null;
  const now = new Date();
  const diffDays = Math.ceil((new Date(warrantyExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">Garantia vencida em {formatDate(warrantyExpiresAt)}</span>;
  }
  if (diffDays <= 30) {
    return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">Garantia vence em {diffDays} dia{diffDays === 1 ? '' : 's'} ({formatDate(warrantyExpiresAt)})</span>;
  }
  return <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">Garantia até {formatDate(warrantyExpiresAt)}</span>;
}

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) redirect('/sem-permissao');

  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      client: true,
      site: true,
      camera: true,
      sensor: true,
      assignments: { orderBy: { assignedAt: 'desc' }, include: { client: true, site: true } },
      maintenances: { orderBy: { performedAt: 'desc' }, include: { performedBy: true } },
    },
  });
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/estoque" className="text-sm text-fg-muted hover:text-fg">← Voltar ao estoque</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-fg">{item.serialNumber}</h1>
          {warrantyBadge(item.warrantyExpiresAt)}
        </div>
        <p className="mt-1 text-sm text-fg-muted">{item.type} · {item.manufacturer ?? '—'} {item.model ?? ''}</p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <h2 className="font-display text-sm font-semibold text-fg">Dados do equipamento</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-fg-muted">Status</dt><dd className="text-fg">{item.status}</dd></div>
            <div><dt className="text-xs text-fg-muted">Propriedade</dt><dd className="text-fg">{item.ownership}</dd></div>
            <div><dt className="text-xs text-fg-muted">Cliente / Site atual</dt><dd className="text-fg">{item.client?.name ?? '—'} {item.site ? `/ ${item.site.name}` : ''}</dd></div>
            <div><dt className="text-xs text-fg-muted">Data da compra</dt><dd className="text-fg">{formatDate(item.purchaseDate)}</dd></div>
            <div><dt className="text-xs text-fg-muted">Custo da compra</dt><dd className="text-fg">{formatMoney(item.purchaseCost)}</dd></div>
            <div><dt className="text-xs text-fg-muted">Garantia até</dt><dd className="text-fg">{formatDate(item.warrantyExpiresAt)}</dd></div>
          </dl>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <h2 className="font-display text-sm font-semibold text-fg">Histórico de custódia</h2>
          {item.assignments.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">Sem histórico de custódia registrado.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th className="px-2 py-2">Cliente / Site</th>
                    <th className="px-2 py-2">De</th>
                    <th className="px-2 py-2">Até</th>
                    <th className="px-2 py-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {item.assignments.map((a) => (
                    <tr key={a.id} className="border-b border-border/60">
                      <td className="px-2 py-2 text-fg">{a.client?.name ?? '—'} {a.site ? `/ ${a.site.name}` : ''}</td>
                      <td className="px-2 py-2 text-fg-muted">{formatDate(a.assignedAt)}</td>
                      <td className="px-2 py-2 text-fg-muted">{a.unassignedAt ? formatDate(a.unassignedAt) : 'em custódia'}</td>
                      <td className="px-2 py-2 text-fg-muted">{a.reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="font-display text-sm font-semibold text-fg">Manutenções</h2>
          {item.maintenances.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">Nenhuma manutenção registrada.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {item.maintenances.map((m) => (
                <li key={m.id} className="rounded-md border border-border/60 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-fg">{m.description}</span>
                    <span className="text-xs text-fg-muted">{formatDate(m.performedAt)}</span>
                  </div>
                  <div className="mt-1 text-xs text-fg-muted">
                    Custo: {formatMoney(m.cost)} {m.performedBy?.name ? `· por ${m.performedBy.name}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-border/60 pt-4">
            <AddMaintenanceForm itemId={item.id} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
