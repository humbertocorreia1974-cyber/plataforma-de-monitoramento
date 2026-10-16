# Fila de processamento em segundo plano (Redis + BullMQ)

Seu app tem uma fila real pra tarefas que não podem travar uma requisição HTTP (envio de e-mail em massa, processamento de arquivo grande, importação, etc).

## Como funciona

1. `POST /api/jobs` com `{ "type": "nome-do-job", "payload": {...} }` enfileira um job real no Redis - devolve `{ jobId }` na hora, sem esperar o processamento.
2. `workers/backgroundWorker.ts` roda como um PROCESSO SEPARADO (não faz parte do `next start`) e processa os jobs da fila continuamente.

## Rodar o worker

O worker precisa ficar rodando o tempo todo, separado do servidor web:

```bash
npx tsx workers/backgroundWorker.ts
```

Em produção, rode isso como um processo próprio (PM2, um segundo serviço no Fly.io/Railway, etc) - se ele não estiver rodando, os jobs ficam enfileirados esperando, mas nunca são processados.

## Configuração

Precisa de um Redis real acessível pelo app - configure `REDIS_HOST`, `REDIS_PORT` e `REDIS_PASSWORD` (ou só `REDIS_HOST`/`REDIS_PORT` se seu Redis não tiver senha, o que não é recomendado em produção).

## Adicionar um tipo de job real

Edite `workers/backgroundWorker.ts` e adicione um `case` na função `processJob` pro tipo de job que seu app realmente precisa (ex: `case 'enviar-email-boas-vindas':`) - o handler padrão só loga e não faz nada além disso.
