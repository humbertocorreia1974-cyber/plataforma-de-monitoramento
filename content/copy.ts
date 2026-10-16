// Copy real gerada por Iris (Marketing) + Luna (Vendas) + Valen (Onboarding).
// Importe isto nas páginas em vez de escrever copy nova - ver README do projeto.
export const copy = {
  "marketing": {
    "heroHeadline": "IA nas suas câmeras, sem trocar o hardware",
    "heroSubheadline": "O VMS self-hosted da JGNEXT roda análise de vídeo em CPU sobre as câmeras que você já tem: pré-filtro de movimento, snapshot no evento e uma central de operação com fila em tempo real, classificação e escalada para incidente.",
    "featureBullets": [
      "Pré-filtro de movimento em CPU (OpenCV background subtraction) antes de qualquer inferência: só processa frame quando há movimento real, sem stream 24/7 pro servidor",
      "Análise self-hosted via CodeProject.AI Server em Docker (CPU, sem GPU) com POST /v1/vision/detection sobre o snapshot capturado no evento",
      "Central de operação multi-câmera com fila de eventos em tempo real (SSE/WebSocket) e workflow do operador: visualizar → classificar (pessoa/veículo/objeto/desconhecido) → descartar ou escalar para Incidente com severidade",
      "Trilha de auditoria imutável em todo evento e incidente: quem viu, quem classificou, quem descartou, quando e de qual IP",
      "Isolamento multi-tenant real por cliente/site — o operador só acessa os sites explicitamente liberados no perfil dele",
      "Health-check de câmera (online/offline/latência) com alerta antes do cliente reclamar",
      "Regras de detecção por câmera: zona, horário, sensibilidade e classe de objeto",
      "Portal do cliente com status dos sites, linha do tempo de eventos e download do snapshot do incidente",
      "ERP de campo com ordens de serviço no app do técnico (PWA): ver O.S. atribuída, check-in no local, foto antes/depois, assinatura do cliente e conclusão",
      "Estoque de equipamentos com número de série, status comodato/vendido e vínculo ao Site, com contratos ligados à Subscription do cliente"
    ],
    "seoTitle": "VMS com IA self-hosted e ERP de campo | JGNEXT",
    "seoDescription": "Análise de vídeo por IA self-hosted sobre câmeras existentes, central de operação com workflow de eventos e ERP de campo com O.S., técnicos e comodato.",
    "headline": "IA nas suas câmeras, sem trocar o hardware",
    "subheadline": "O VMS self-hosted da JGNEXT roda análise de vídeo em CPU sobre as câmeras que você já tem: pré-filtro de movimento, snapshot no evento e uma central de operação com fila em tempo real, classificação e escalada para incidente.",
    "bullets": [
      "Pré-filtro de movimento em CPU (OpenCV background subtraction) antes de qualquer inferência: só processa frame quando há movimento real, sem stream 24/7 pro servidor",
      "Análise self-hosted via CodeProject.AI Server em Docker (CPU, sem GPU) com POST /v1/vision/detection sobre o snapshot capturado no evento",
      "Central de operação multi-câmera com fila de eventos em tempo real (SSE/WebSocket) e workflow do operador: visualizar → classificar (pessoa/veículo/objeto/desconhecido) → descartar ou escalar para Incidente com severidade",
      "Trilha de auditoria imutável em todo evento e incidente: quem viu, quem classificou, quem descartou, quando e de qual IP",
      "Isolamento multi-tenant real por cliente/site — o operador só acessa os sites explicitamente liberados no perfil dele",
      "Health-check de câmera (online/offline/latência) com alerta antes do cliente reclamar",
      "Regras de detecção por câmera: zona, horário, sensibilidade e classe de objeto",
      "Portal do cliente com status dos sites, linha do tempo de eventos e download do snapshot do incidente",
      "ERP de campo com ordens de serviço no app do técnico (PWA): ver O.S. atribuída, check-in no local, foto antes/depois, assinatura do cliente e conclusão",
      "Estoque de equipamentos com número de série, status comodato/vendido e vínculo ao Site, com contratos ligados à Subscription do cliente"
    ]
  },
  "sales": {
    "pricingBlurb": "Mensalidade por site e por câmera monitorada: você paga pela operação que usa, com análise de IA rodando no seu próprio servidor e sem trocar as câmeras que já estão instaladas.",
    "ctaPrimary": "Começar agora",
    "ctaSecondary": "Falar com especialista",
    "pricing": "Mensalidade por site e por câmera monitorada: você paga pela operação que usa, com análise de IA rodando no seu próprio servidor e sem trocar as câmeras que já estão instaladas.",
    "cta": "Começar agora"
  },
  "onboarding": {
    "welcomeTitle": "Bem-vindo à Plataforma de Monitoramento JGNEXT",
    "steps": [
      "Cadastre o cliente e o Site, depois vincule as câmeras (RTSP/ONVIF) e sensores ao Site",
      "Configure as regras de detecção por câmera: zona, horário, sensibilidade e classe de objeto",
      "Abra a Central de Operação e acompanhe a fila de eventos em tempo real: visualize, classifique e escale para Incidente quando necessário",
      "Cadastre técnicos e equipamentos em comodato para começar a emitir Ordens de Serviço pelo app do técnico (PWA)"
    ],
    "helpTips": [
      "Use as contas de teste por papel do seed em pt-BR para explorar cada visão antes de configurar os dados reais",
      "O pré-filtro de movimento roda em CPU antes da inferência: ajuste a sensibilidade da zona para reduzir eventos falsos sem perder detecções reais",
      "Toda ação na fila de eventos fica na trilha de auditoria imutável — classifique e descarte com o mesmo cuidado que você quer ver no relatório do cliente"
    ]
  }
} as const;
