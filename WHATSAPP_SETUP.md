# Configurar o WhatsApp

Seu app tem DUAS formas de mandar mensagem no WhatsApp pros seus clientes. Escolha UMA:

## Opção 1 - API oficial da Meta (recomendada se você tem CNPJ)

Mais estável, sem risco de bloqueio, feita pra uso comercial de verdade.

1. Crie uma conta em https://developers.facebook.com
2. Crie um app do tipo "Business", adicione o produto "WhatsApp"
3. Pegue o `WHATSAPP_ACCESS_TOKEN` e o `WHATSAPP_PHONE_NUMBER_ID` gerados
4. Configure essas duas variáveis de ambiente no seu deploy
5. Pronto - a rota `app/api/whatsapp/webhook/route.ts` já está pronta pra usar

**Exige verificação de empresa da Meta (CNPJ ou equivalente) pra sair do modo de teste.**

## Opção 2 - Sem CNPJ (conecta seu WhatsApp normal via QR code)

Funciona sem nenhum cadastro na Meta - conecta como se fosse o WhatsApp Web normal.

1. Depois do deploy, acesse `/admin/whatsapp-connect` no seu app
2. Escaneie o QR code com o WhatsApp do celular que vai mandar as mensagens
3. Pronto - o app já pode mandar mensagem chamando a rota interna `app/api/whatsapp-baileys/notify/route.ts`

**Atenção**: esse caminho usa um protocolo não-oficial (o mesmo do WhatsApp Web) - a Meta pode bloquear o número em caso de uso muito automatizado/em massa. Use com moderação (notificações pontuais, não disparo em massa) até conseguir migrar pra Opção 1.
