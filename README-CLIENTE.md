# Guia do Cliente — Plataforma de Monitoramento

Este app foi construído pelo JGNEXT. Este guia é o ponto de partida — leia
antes de divulgar pra alguém.

## Login pra testar
O app já sobe com dados de exemplo e contas de teste (senha `Demo@1234` em todas):
- `admin@demo.app` — acesso administrativo completo
- 1 conta por papel do seu app (operador, cliente, técnico, admin)
- Demais contas de teste: veja `prisma/seed.js`.

⚠️ **Antes de divulgar pra clientes de verdade**, apague os dados de exemplo (`npx prisma db seed` só adiciona — rode uma limpeza manual do banco de produção) ou troque a senha das contas de teste.

## O que já vem pronto
- Login, cadastro e "esqueci minha senha" (com e-mail real).
- Painel administrativo com verificação de saúde do sistema.
- SEO técnico (sitemap, robots, título/descrição por página).
- **Assistente de Atendimento** (dormente) — ver `ASSISTENTE.md` pra ativar.
- **API própria** pra integrar com outros sistemas — ver `API.md`.
- **Kit de marketing pronto pra divulgar** — pasta `MARKETING/`.
- Ver `SCORECARD.md` pro boletim de qualidade honesto deste app (o que está pronto, o que precisa de atenção).

## Integrações — o que configurar antes de ir ao ar
- **Pagamentos (Stripe)** — configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
- **WhatsApp** — conecte no painel (QR code) ou configure a API oficial da Meta.
- **E-mail** — configure `RESEND_API_KEY` (recomendado) ou `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`, senão o app só loga o e-mail no console.
- **Redes sociais (Instagram/Facebook)** — configure `META_VERIFY_TOKEN` e `META_PAGE_ACCESS_TOKEN` pra ativar o webhook de mensagens.

## Dúvidas
Fale com o suporte JGNEXT.
