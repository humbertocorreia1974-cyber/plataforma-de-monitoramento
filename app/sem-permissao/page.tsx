import Link from 'next/link';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Acesso restrito | Plataforma de Monitoramento',
};

export default function SemPermissaoPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardTitle>Você não tem permissão para acessar esta área</CardTitle>
        <CardBody className="space-y-4">
          <p>
            Sua conta está autenticada, mas o seu perfil de acesso não inclui esta
            seção. Fale com o administrador da sua conta se acredita que isso é um
            engano.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="md">Voltar ao painel</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
