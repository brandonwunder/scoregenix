import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { name, email, password, plan } = session.metadata!;

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash,
          name,
          role: "CUSTOMER",
        },
      });

      const startDate = new Date();
      const endDate = new Date();
      switch (plan) {
        case "MONTHLY":
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case "QUARTERLY":
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case "SEMIANNUAL":
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case "ANNUAL":
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          planType: plan as any,
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          startDate,
          endDate,
          amount: (session.amount_total || 0) / 100,
        },
        create: {
          userId: user.id,
          planType: plan as any,
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          startDate,
          endDate,
          amount: (session.amount_total || 0) / 100,
        },
      });

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: String(invoice.subscription) },
          data: { status: "PAST_DUE" },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: "EXPIRED" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
