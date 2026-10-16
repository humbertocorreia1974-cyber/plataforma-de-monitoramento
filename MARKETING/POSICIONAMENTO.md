# POSICIONAMENTO — JGNEXT Plataforma de Monitoramento

## Para quem é
Donos de negócio com câmeras já instaladas (lojas, clínicas, indústrias pequenas, condomínios, estacionamentos, obras) que precisam de monitoramento inteligente, mas não querem trocar equipamentos, contratar equipe 24/7 nem depender de nuvem caríssima.

## A dor
As câmeras existem, mas ninguém olha. Quando acontece algo, o vídeo está lá — só que ninguém viu na hora. Contratar central de monitoramento é caro, instalar sistema novo é caro, e soluções em nuvem cobram por câmera/mês e ainda expõem a imagem do negócio. O dono fica refém de “ver depois” em vez de agir no momento.

## A promessa em 1 frase
**IA nas suas câmeras, sem trocar o hardware** — a JGNEXT transforma suas câmeras atuais em uma central de eventos inteligente, self-hosted, com operador classificando o que importa e trilha de auditoria de tudo.

## 3 diferenciais
1. **Pré-filtro de movimento em CPU antes da IA** — só processa frame quando há movimento real (OpenCV background subtraction). Isso significa menos processamento, menos custo e mais velocidade na fila de eventos.
2. **Self-hosted com CodeProject.AI em Docker, sem GPU** — análise de vídeo roda no seu ambiente, com POST /v1/vision/detection sobre snapshot do evento. Sem stream 24/7 pro servidor, sem dependência de nuvem de terceiros.
3. **Central de operação com workflow e auditoria imutável** — cada evento tem fila em tempo real (SSE/WebSocket), classificação (pessoa/veículo/objeto/desconhecido), descarte ou escalada para Incidente com severidade. Tudo registrado: quem viu, quem classificou, quem descartou, quando e de qual IP.

## Tom de voz
Direto, técnico sem jargão desnecessário, focado em operação real. Fala como quem entende de campo e de TI, não como quem vende sonho. Sem “revolucionário”, sem “melhor do mercado”. Explica o como, mostra o porquê, respeita o tempo do dono de negócio.

## 5 palavras que descrevem a marca
Self-hosted, auditável, operacional, multi-tenant, sem-troca-de-hardware.