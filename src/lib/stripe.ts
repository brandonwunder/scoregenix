import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export const PLAN_PRICES: Record<string, string> = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY!,
  QUARTERLY: process.env.STRIPE_PRICE_QUARTERLY!,
  SEMIANNUAL: process.env.STRIPE_PRICE_SEMIANNUAL!,
  ANNUAL: process.env.STRIPE_PRICE_ANNUAL!,
};
