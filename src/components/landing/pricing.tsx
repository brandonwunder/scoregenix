"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const tiers = [
  {
    name: "Standard",
    price: "$997",
    period: "/year",
    billing: "Billed quarterly ($249 × 4)",
    description: "Full access to our algorithm's daily picks and analytics platform",
    features: [
      "Daily algorithm-generated picks",
      "Full dashboard access",
      "Performance analytics & tracking",
      "Multi-sport coverage (NFL, NBA, MLB, NHL, more)",
      "Real-time game data & odds",
      "Email alerts for new picks",
      "Unlimited bet tracking",
      "Export reports",
    ],
    cta: "Start with Standard",
    ctaLink: "/signup",
    highlight: false,
  },
  {
    name: "Elite",
    price: "By Invitation Only",
    period: "",
    billing: "Custom pricing based on volume",
    description: "White-glove managed execution for serious investors",
    features: [
      "Everything in Standard, plus:",
      "Fully managed bet execution",
      "Personalized strategy alignment",
      "Dedicated account manager",
      "Priority support (24/7)",
      "Custom risk profiling",
      "Advanced portfolio analytics",
      "Quarterly strategy reviews",
    ],
    cta: "Apply for Elite",
    ctaLink: "mailto:elite@scoregenix.com?subject=Elite%20Tier%20Application",
    highlight: true,
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
            Choose Your <span className="text-emerald-400">Edge</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            Two tiers designed for different levels of commitment
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
              className={`relative rounded-xl p-8 ${
                tier.highlight
                  ? "bg-emerald-400/5 border-2 border-emerald-400"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-black">
                    Exclusive
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-white/40">{tier.description}</p>
              </div>

              <div className="mb-6">
                <div
                  className="text-4xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {tier.price}
                  {tier.period && (
                    <span className="text-lg text-white/40">{tier.period}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-white/30">{tier.billing}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
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
                    <span className={`text-sm ${feature.includes("Everything") ? "text-white/40 italic" : "text-white/60"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {tier.ctaLink.startsWith("mailto:") ? (
                <a
                  href={tier.ctaLink}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  href={tier.ctaLink}
                  className={`inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {tier.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
