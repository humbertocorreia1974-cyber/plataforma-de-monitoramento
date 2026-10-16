import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enqueueJob } from '@/lib/queue';

export const dynamic = 'force-dynamic';

// Enfileira um job real pra processamento assincrono (worker separado, ver
// workers/backgroundWorker.ts e JOBS_SETUP.md). NAO processa nada aqui - so
// aceita e devolve o id do job.
//
// 🔒 Protegido: exige um usuario logado OU o header `x-jobs-secret` batendo
// com JOBS_API_SECRET (pra chamadas server-to-server / cron). Sem isso,
// qualquer visitante enfileirava jobs (abuso de recurso).
export async function POST(request: Request) {
  try {
    const secret = process.env.JOBS_API_SECRET;
    const headerSecret = request.headers.get('x-jobs-secret');
    const authedBySecret = !!secret && headerSecret === secret;
    if (!authedBySecret) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
      }
    }
    const { type, payload } = await request.json();
    if (!type) {
      return NextResponse.json({ error: 'type e\' obrigatorio' }, { status: 400 });
    }
    const job = await enqueueJob(type, payload || {});
    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
