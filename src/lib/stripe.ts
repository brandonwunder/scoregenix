import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function getPlanPrices(): Record<string, string> {
  return {
    MONTHLY: process.env.STRIPE_PRICE_MONTHLY || "",
    QUARTERLY: process.env.STRIPE_PRICE_QUARTERLY || "",
    SEMIANNUAL: process.env.STRIPE_PRICE_SEMIANNUAL || "",
    ANNUAL: process.env.STRIPE_PRICE_ANNUAL || "",
  };
}
