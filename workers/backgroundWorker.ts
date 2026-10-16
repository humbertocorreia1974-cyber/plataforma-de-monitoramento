import { Worker, Job } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
};

// Handlers por tipo de job - adicione um case pra cada tipo real que o app
// precisa processar (o nome do job e' o primeiro argumento de enqueueJob em lib/queue.ts).
async function processJob(type: string, payload: unknown) {
  switch (type) {
    default:
      console.log(`[Worker] Job \"${type}\" recebido, sem handler especifico ainda:`, payload);
      return { received: true };
  }
}

const worker = new Worker(
  'background-jobs',
  async (job: Job) => {
    console.log(`[Worker] Processando job ${job.id} (${job.name})`);
    return processJob(job.name, job.data);
  },
  { connection, concurrency: 5 }
);

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} concluido.`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} falhou:`, err.message));

console.log('[Worker] Rodando e esperando jobs...');
