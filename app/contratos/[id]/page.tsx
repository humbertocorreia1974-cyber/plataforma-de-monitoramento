import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody } from '@/components/ui/card';
import SignContractForm from './sign-contract-form';

export const dynamic = 'force-dynamic';

function formatDate(d: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR');
}

export default async function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['admin', 'cliente'].includes(role)) redirect('/sem-permissao');

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: true,
      site: true,
      signatures: { orderBy: { signedAt: 'desc' } },
    },
  });
  if (!contract) notFound();

  const isCliente = role === 'cliente';
  if (isCliente && contract.clientId !== (session.user as any).clientId) redirect('/sem-permissao');

  const canSign = role === 'admin' || isCliente;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/contratos" className="text-sm text-fg-muted hover:text-fg">← Voltar aos contratos</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-fg">{contract.title}</h1>
        <p className="mt-1 text-sm text-fg-muted">{contract.code} · {contract.client.name}{contract.site ? ` · ${contract.site.name}` : ''}</p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-fg-muted">Valor mensal</dt><dd className="text-fg">R$ {Number(contract.monthlyValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</dd></div>
            <div><dt className="text-xs text-fg-muted">Ciclo</dt><dd className="text-fg">{contract.billingCycle}</dd></div>
            <div><dt className="text-xs text-fg-muted">Status</dt><dd className="text-fg">{contract.status}</dd></div>
            <div><dt className="text-xs text-fg-muted">Início</dt><dd className="text-fg">{formatDate(contract.startDate)}</dd></div>
            <div><dt className="text-xs text-fg-muted">Fim</dt><dd className="text-fg">{formatDate(contract.endDate)}</dd></div>
            <div><dt className="text-xs text-fg-muted">Assinado em</dt><dd className="text-fg">{formatDate(contract.signedAt)}</dd></div>
          </dl>
          {contract.description && <p className="mt-4 text-sm text-fg-muted">{contract.description}</p>}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <h2 className="font-display text-sm font-semibold text-fg">Assinaturas registradas</h2>
          {contract.signatures.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">Este contrato ainda não foi assinado digitalmente.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {contract.signatures.map((s) => (
                <li key={s.id} className="rounded-md border border-border/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-fg">{s.signerName}{s.signerDocument ? ` (${s.signerDocument})` : ''}</span>
                    <span className="text-xs text-fg-muted">{formatDate(s.signedAt)}</span>
                  </div>
                  <div className="mt-1 text-xs text-fg-muted">IP: {s.ipAddress ?? '—'}</div>
                  {s.signatureData && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.signatureData} alt={`Assinatura de ${s.signerName}`} className="mt-2 h-20 rounded border border-border/60 bg-white" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {canSign && (
        <Card>
          <CardBody>
            <h2 className="font-display text-sm font-semibold text-fg">Assinar contrato</h2>
            <p className="mt-1 text-sm text-fg-muted">Ao confirmar, a assinatura, horário, IP e dispositivo são registrados como trilha de auditoria.</p>
            <div className="mt-4">
              <SignContractForm contractId={contract.id} />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
