// Conteúdo da landing. O builder (DeveloperAgent) reescreve ESTE arquivo com o
// texto real do produto do cliente — a estrutura e os nomes dos campos são fixos.
// `app/page.tsx` (o skeleton) renderiza tudo a partir daqui, então a landing sai
// sempre com o mesmo layout premium, só o conteúdo muda.

export type LandingContent = {
  name: string;
  hero: { badge?: string; headline: string; sub: string; cta: string; ctaHref?: string; ctaSecondary?: string; ctaSecondaryHref?: string };
  logos?: string[];
  features: { icon: string; title: string; body: string }[];
  steps?: { title: string; body: string }[];
  pricing?: { name: string; price: string; period?: string; features: string[]; cta: string; href?: string; highlight?: boolean }[];
  testimonials?: { quote: string; name: string; role?: string }[];
  faq?: { q: string; a: string }[];
  cta?: { headline: string; sub?: string; button: string; href?: string };
};

export const landing: LandingContent = {
  name: "Seu Produto",
  hero: {
    badge: "Novo",
    headline: "A frase que faz o visitante querer isso agora.",
    sub: "Uma linha explicando o que o produto resolve, pra quem, e por que é melhor.",
    cta: "Começar grátis",
    ctaHref: "#contato",
    ctaSecondary: "Ver como funciona",
    ctaSecondaryHref: "#features",
  },
  features: [
    { icon: "Zap", title: "Rápido de configurar", body: "Comece em minutos, sem instalar nada. Tudo roda no navegador." },
    { icon: "ShieldCheck", title: "Seguro por padrão", body: "Seus dados são criptografados e nunca compartilhados." },
    { icon: "BarChart3", title: "Decisões com dados", body: "Relatórios claros que mostram exatamente o que importa." },
  ],
  steps: [
    { title: "Crie sua conta", body: "Sem cartão de crédito. Leva 30 segundos." },
    { title: "Configure em minutos", body: "Assistente guiado, exemplos prontos." },
    { title: "Veja o resultado", body: "Acompanhe o progresso em tempo real." },
  ],
  pricing: [
    { name: "Free", price: "R$0", period: "/mês", features: ["1 usuário", "Recursos essenciais", "Suporte por email"], cta: "Começar", highlight: false },
    { name: "Pro", price: "R$97", period: "/mês", features: ["Usuários ilimitados", "Todos os recursos", "Suporte prioritário"], cta: "Assinar Pro", highlight: true },
    { name: "Business", price: "Fale com a gente", features: ["SLA", "Onboarding dedicado", "Integrações sob medida"], cta: "Falar com vendas", highlight: false },
  ],
  testimonials: [
    { quote: "Mudou a forma como a gente trabalha. Não voltaria atrás.", name: "Ana Ribeiro", role: "Fundadora, Loja X" },
    { quote: "Configurei numa tarde e já vi resultado na primeira semana.", name: "Carlos Menezes", role: "Head de Ops, Y" },
  ],
  faq: [
    { q: "Preciso de cartão de crédito pra testar?", a: "Não. O plano Free é gratuito pra sempre e não pede cartão." },
    { q: "Meus dados ficam seguros?", a: "Sim. Tudo é criptografado em trânsito e em repouso." },
    { q: "Posso cancelar quando quiser?", a: "Pode. Sem multa, sem burocracia." },
  ],
  cta: {
    headline: "Pronto pra começar?",
    sub: "Crie sua conta gratuita agora — leva menos de um minuto.",
    button: "Criar conta grátis",
    href: "#contato",
  },
};
