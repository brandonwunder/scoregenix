"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const features = [
  "Full dashboard access",
  "Unlimited bet tracking",
  "Performance analytics",
  "Multi-sport coverage",
  "Priority support",
  "Advanced analytics",
  "Export reports",
  "Early feature access",
  "Custom alerts",
  "API access",
  "Dedicated support",
  "White-glove onboarding",
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
            One plan. Full access. Everything you need to win.
          </p>
        </motion.div>

        <div className="mt-16 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative w-full max-w-md rounded-xl p-8 bg-emerald-400/5 border-2 border-emerald-400"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-black">
                Full Access
              </span>
            </div>

            <div className="mb-2 text-center">
              <h3
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Annual Plan
              </h3>
              <p className="mt-1 text-sm text-white/40">
                Everything included — billed yearly
              </p>
            </div>

            <div className="mb-6 text-center">
              <span
                className="text-5xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                $997
              </span>
              <span className="text-white/40">/year</span>
            </div>

            <ul className="mb-8 space-y-3">
              {features.map((feature) => (
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
              href="/signup"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors bg-emerald-500 text-black hover:bg-emerald-400"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
