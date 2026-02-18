import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPlanPrices } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.literal("ANNUAL"),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, email, name, password } = checkoutSchema.parse(body);

    const priceId = getPlanPrices()[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/signup?cancelled=true`,
      customer_email: email,
      metadata: { name, email, password, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
