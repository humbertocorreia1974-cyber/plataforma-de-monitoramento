import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
};

export const backgroundQueue = new Queue('background-jobs', { connection });

// Enfileira um job real - o `type` decide qual case workers/backgroundWorker.ts
// executa. Nunca processa nada aqui (isso quebraria a resposta HTTP) - só
// registra o job e devolve o id, o worker (processo separado) executa depois.
export async function enqueueJob(type: string, payload: Record<string, unknown>) {
  return backgroundQueue.add(type, payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}
