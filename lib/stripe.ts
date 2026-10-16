import Stripe from "stripe";

// Lazy: NÃO constrói o cliente no import. Next.js roda o módulo durante o
// "collect page data" do build — construir o Stripe aí (com chave inválida
// ou ausente) quebra o build ("Failed to collect page data"). Só instancia
// na primeira chamada real da rota.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY ?? "sk_test_REDACTED"
    );
  }
  return _stripe;
}

// compat: alguns imports usam `stripe` direto. Proxy que instancia sob demanda.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    const s = getStripe() as unknown as Record<string | symbol, unknown>;
    const v = s[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(s) : v;
  },
});
