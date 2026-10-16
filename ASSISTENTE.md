# Assistente de Atendimento JGNEXT

Seu app já vem **pronto** para o Assistente de Atendimento da JGNEXT —
auto-atendimento 24/7 que **lê o seu app e o seu negócio** e responde clientes,
agenda horários e qualifica leads em **WhatsApp, Telegram e no chat do site**.

## Como ativar
1. Ative o add-on "Assistente JGNEXT" no painel da JGNEXT.
2. Vamos gerar um `JGNEXT_CHATBOT_TOKEN` e configurar `JGNEXT_API_BASE_URL` no seu app.
3. Defina `NEXT_PUBLIC_JGNEXT_ASSISTANT=on` para o balão de chat aparecer no site.
4. No formulário do assistente, escolha o objetivo (tirar dúvidas / agendar / tirar pedido / qualificar lead), o tom de voz e o horário de atendimento.
5. O assistente **lê o seu app publicado automaticamente** (RAG) — não precisa você digitar tudo.

## Canais
- **Chat no site**: já embutido (`components/jgnext-assistant.tsx`).
- **WhatsApp / Telegram**: conecte no painel; usa o mesmo cérebro.

## Agendamento
Se o objetivo for "agendar", o assistente checa disponibilidade e cria o
agendamento direto — sem você intervir.
