# LANDING COPY — JGNEXT Plataforma de Monitoramento

## Headline
**IA nas suas câmeras, sem trocar o hardware**

## Subheadline
Transforme suas câmeras atuais em uma central de eventos inteligente: pré-filtro de movimento, análise por IA self-hosted, fila de eventos em tempo real e workflow de operador com trilha de auditoria imutável.

## 5 bullets de benefício
- **Aproveite o que você já tem**: cadastre câmeras RTSP/ONVIF existentes e comece a receber eventos sem comprar equipamento novo.
- **Só processa o que importa**: pré-filtro de movimento em CPU (OpenCV) antes de qualquer inferência — menos ruído, mais velocidade.
- **IA self-hosted, sem GPU**: CodeProject.AI Server em Docker analisa snapshot do evento via POST /v1/vision/detection. Sem stream 24/7 pro servidor.
- **Operação com workflow claro**: fila de eventos em tempo real (SSE/WebSocket), classificação (pessoa/veículo/objeto/desconhecido), descarte ou escalada para Incidente com severidade.
- **Auditoria de verdade**: cada evento e incidente tem trilha imutável — quem viu, quem classificou, quem descartou, quando e de qual IP. Isolamento multi-tenant por cliente/site.

## Como funciona (3 passos)
1. **Conecte suas câmeras** — cadastre RTSP/ONVIF por Site do cliente. O gateway leve do lado do cliente captura snapshot no evento de movimento, sem mandar stream contínuo pro servidor.
2. **A IA analisa o evento** — o pré-filtro de movimento em CPU decide se vale processar. Se valer, o CodeProject.AI Server (Docker, CPU) roda a detecção no snapshot.
3. **Seu operador decide** — os eventos caem na central multi-câmera em tempo real. O operador visualiza, classifica, descarta ou escala para Incidente. Tudo auditado.

## FAQ
**1. Preciso trocar minhas câmeras?**
Não. A plataforma foi feita para aproveitar câmeras existentes com RTSP/ONVIF. Você cadastra o que já tem e configura regras por câmera (zona, horário, sensibilidade, classe de objeto).

**2. A IA roda na nuvem de vocês?**
Não. A análise é self-hosted via CodeProject.AI Server em Docker, rodando em CPU, sem GPU. O gateway do lado do cliente captura snapshot no evento de movimento — não há stream 24/7 pro servidor.

**3. Como funciona o isolamento entre clientes?**
É multi-tenant real: cada operador só acessa os sites explicitamente liberados no perfil dele. Um cliente nunca vê dado de outro.

**4. O que é a trilha de auditoria imutável?**
É o registro de tudo que acontece com cada evento e incidente: quem visualizou, quem classificou, quem descartou, quando e de qual IP. Serve para responsabilizar, treinar e provar conformidade.

**5. Vocês oferecem outros serviços?**
Sim. A JGNEXT também oferece assistente de atendimento, API e gestão de tráfego. Se você precisa integrar a plataforma ao seu sistema ou atrair mais clientes, fale com a gente.

## CTAs
- **CTA 1 (principal)**: Quero ver a plataforma rodando com minhas câmeras
- **CTA 2 (secundário)**: Falar com um especialista JGNEXT