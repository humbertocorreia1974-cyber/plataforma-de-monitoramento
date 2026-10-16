# EMAIL — Sequência de 4 e-mails

## E-mail 1 — Boas-vindas
**Assunto:** Suas câmeras já podem trabalhar por você

Olá, {{nome}},

Que bom ter você por aqui. A JGNEXT Plataforma de Monitoramento existe para um cenário muito comum: você já tem câmeras instaladas, mas não tem operação olhando o tempo todo. O vídeo fica gravado, esperando alguém lembrar de ver.

A proposta é simples: **IA nas suas câmeras, sem trocar o hardware**. A gente conecta no que você já tem (RTSP/ONVIF), captura snapshot no evento de movimento e roda análise self-hosted com CodeProject.AI Server em Docker, sem GPU. O operador vê os eventos em tempo real e decide o que fazer.

Nos próximos dias vou te contar como isso funciona na prática e por que tanta gente está migrando de “gravar tudo” para “operar o que importa”.

Um abraço,
Equipe JGNEXT

## E-mail 2 — Valor/educação
**Assunto:** Por que processar todo frame é desperdício

Olá, {{nome}},

Deixa eu te contar um detalhe técnico que muda tudo: a maioria das soluções de IA em vídeo processa frame a frame, o tempo todo. Isso consome recurso, encarece e atrasa a fila de eventos.

Na JGNEXT, antes de qualquer inferência, existe um **pré-filtro de movimento em CPU** usando OpenCV background subtraction. Ou seja: só processa frame quando há movimento real. Depois disso, o CodeProject.AI Server (Docker, CPU, sem GPU) analisa o snapshot do evento via POST /v1/vision/detection.

O resultado prático:
- menos processamento;
- menos custo;
- fila de eventos mais rápida;
- operador focado no que importa.

Se quiser, no próximo e-mail eu mostro como fica a central de operação com workflow e auditoria.

Abraço,
Equipe JGNEXT

## E-mail 3 — Quebra de objeção
**Assunto:** “Mas eu não quero mandar meu vídeo pra nuvem”

Olá, {{nome}},

Essa é uma das objeções mais comuns — e faz total sentido. Por isso a JGNEXT é **self-hosted**. A análise roda no seu ambiente, com CodeProject.AI Server em Docker, em CPU, sem GPU. O gateway do lado do cliente captura snapshot no evento de movimento. Não há stream 24/7 pro servidor.

Outras objeções que a gente ouve:

**“Vou ter que trocar as câmeras?”** Não. Você cadastra RTSP/ONVIF e configura regras por câmera (zona, horário, sensibilidade, classe de objeto).

**“E se eu tiver vários clientes/sites?”** A plataforma é multi-tenant real: cada operador só acessa os sites liberados no perfil dele.

**“Como eu sei que ninguém mexeu no evento?”** Trilha de auditoria imutável: quem viu, quem classificou, quem descartou, quando e de qual IP.

Se ainda tiver dúvida, responde este e-mail. A gente lê.

Abraço,
Equipe JGNEXT

## E-mail 4 — Oferta
**Assunto:** Vamos colocar IA nas suas câmeras?

Olá, {{nome}},

Você já entendeu como funciona: pré-filtro de movimento, IA self-hosted, central de operação com fila em tempo real, workflow de operador e auditoria imutável. Agora é hora de ver isso rodando com as **suas** câmeras.

O que a gente faz juntos:
1. Conectamos suas câmeras RTSP/ONVIF por Site.
2. Configuramos regras de detecção (zona, horário, sensibilidade, classe).
3. Ativamos o gateway de captura por snapshot no evento.
4. Liberamos a central de operação para o seu time.

E se você precisar de mais, a JGNEXT também oferece **assistente de atendimento**, **API** e **gestão de tráfego**.

Responde este e-mail com “quero ver” que a gente agenda uma demonstração.

Abraço,
Equipe JGNEXT