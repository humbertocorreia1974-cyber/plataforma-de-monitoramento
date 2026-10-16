import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NewInventoryForm from './new-inventory-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Novo equipamento | Estoque',
  description: 'Cadastre câmeras, sensores, DVRs e NVRs com número de série e propriedade comodato/vendido.',
};

export default async function NovoEstoquePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['admin', 'operador'].includes(role)) redirect('/');

  const [clients, sites] = await Promise.all([
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.site.findMany({ select: { id: true, name: true, code: true, clientId: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/estoque" className="text-sm text-fg-muted hover:text-fg">← Voltar ao estoque</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-fg">Novo equipamento</h1>
      </div>
      <Card>
        <CardBody>
          <NewInventoryForm clients={clients} sites={sites} />
        </CardBody>
      </Card>
    </div>
  );
}
