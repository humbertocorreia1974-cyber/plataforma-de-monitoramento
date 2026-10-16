import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Webhook do Stripe: o Stripe chama esta rota quando um pagamento/assinatura
// muda de estado. A URL desta rota + o STRIPE_WEBHOOK_SECRET são configurados
// automaticamente pelo JGNEXT quando você conecta sua conta Stripe (ou à mão:
// Stripe Dashboard -> Developers -> Webhooks -> add endpoint {seu-dominio}/api/stripe/webhook,
// evento checkout.session.completed, e cole o "Signing secret" em STRIPE_WEBHOOK_SECRET).
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!secret || !sig) {
    // Sem webhook configurado ainda: não quebra, só não processa.
    return NextResponse.json({ received: true, skipped: "webhook não configurado" });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "assinatura inválida";
    return NextResponse.json({ error: `Webhook: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email ?? undefined;
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (email) {
      await prisma.user.updateMany({
        where: { email },
        data: { plan: "pro", ...(customerId ? { stripeCustomerId: customerId } : {}) },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customerId) {
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "free" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
