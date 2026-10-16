import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: 9700,
          product_data: { name: "Plano Pro" },
        },
      };

  const checkout = await getStripe().checkout.sessions.create({
    mode: priceId ? "subscription" : "payment",
    customer_email: user.email,
    line_items: [lineItem],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancel`,
  });

  return NextResponse.json({ url: checkout.url });
}
