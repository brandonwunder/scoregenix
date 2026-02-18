"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Monthly",
    key: "MONTHLY",
    price: 29,
    period: "mo",
    description: "Perfect for trying it out",
    features: [
      "Full dashboard access",
      "Unlimited bet tracking",
      "Performance analytics",
      "Multi-sport coverage",
    ],
    highlight: false,
  },
  {
    name: "Quarterly",
    key: "QUARTERLY",
    price: 24,
    period: "mo",
    description: "Save 17% — billed $72/quarter",
    features: [
      "Everything in Monthly",
      "Priority support",
      "Advanced analytics",
      "Export reports",
    ],
    highlight: false,
  },
  {
    name: "Semi-Annual",
    key: "SEMIANNUAL",
    price: 19,
    period: "mo",
    description: "Save 34% — billed $114/6 months",
    features: [
      "Everything in Quarterly",
      "Early feature access",
      "Custom alerts",
      "API access",
    ],
    highlight: false,
  },
  {
    name: "Annual",
    key: "ANNUAL",
    price: 14,
    period: "mo",
    description: "Save 52% — billed $168/year",
    features: [
      "Everything in Semi-Annual",
      "Dedicated support",
      "White-glove onboarding",
      "Lifetime price lock",
    ],
    highlight: true,
    badge: "Best Value",
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Simple, Transparent{" "}
            <span className="text-emerald-400">Pricing</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            No hidden fees. Cancel anytime. Every plan includes full platform
            access.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
              className={`relative rounded-xl p-6 flex flex-col ${
                plan.highlight
                  ? "bg-emerald-400/5 border-2 border-emerald-400"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-black">
                    {(plan as any).badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-white/40">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span
                  className="text-4xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  ${plan.price}
                </span>
                <span className="text-white/40">/{plan.period}</span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    <span className="text-sm text-white/60">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?plan=${plan.key}`}
                className={`inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : "border border-white/20 text-white hover:bg-white/10"
                }`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
