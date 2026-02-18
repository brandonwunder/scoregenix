"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400/10 via-transparent to-emerald-400/5 px-8 py-16 sm:px-16 sm:py-20 text-center"
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(52, 211, 153, 0.15), transparent 70%)",
            }}
          />

          <div className="relative z-10">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Take Your
              <br />
              Betting to the{" "}
              <span className="text-emerald-400">Next Level</span>?
            </h2>
            <p className="mt-6 mx-auto max-w-xl text-lg text-white/50">
              Join thousands of bettors who are already using data to make
              smarter decisions. Start your journey today.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 text-base font-semibold text-black transition-colors hover:bg-emerald-400"
              >
                Start Winning Today
              </Link>
              <Link
                href="#pricing"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-8 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
