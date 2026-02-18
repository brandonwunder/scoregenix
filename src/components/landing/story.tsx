"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/**
 * Story Section Component
 *
 * Displays the "50 Years in the Making" narrative section that tells ScoreGenix's origin story.
 * Features a two-column layout with narrative content on the left and callouts on the right.
 *
 * @component
 * @example
 * ```tsx
 * <Story />
 * ```
 */
export function Story() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            50 Years in the{" "}
            <span className="text-emerald-400">Making</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            From a father&apos;s curiosity to a proven algorithm
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Narrative */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The Genesis
              </h3>
              <p className="text-white/50 leading-relaxed">
                In 1971, an accounting executive with a passion for numbers began
                exploring a radical idea: could the same analytical rigor applied to
                financial markets predict outcomes in professional sports? What started
                as a personal experiment became a five-decade pursuit of a systematic,
                emotion-free approach to sports analysis.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The Algorithm
              </h3>
              <p className="text-white/50 leading-relaxed">
                Today, ScoreGenix&apos;s proprietary algorithm analyzes{" "}
                <span className="text-emerald-400 font-medium">50+ performance metrics</span>{" "}
                per team across every major sport. After 13+ years of continuous refinement,
                it identifies high-probability opportunities with surgical precision —
                removing human emotion from every decision.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The Breakthrough
              </h3>
              <p className="text-white/50 leading-relaxed">
                For years, traditional sportsbooks would ban winning players at 64%+ win
                rates. The emergence of{" "}
                <span className="text-emerald-400 font-medium">sports exchanges</span> —
                peer-to-peer platforms — changed everything. No bans, no restrictions, and
                the ability to scale without limits. Sports trading as a legitimate
                investment strategy was finally possible.
              </p>
            </motion.div>
          </div>

          {/* Right: Key stat + what makes it different */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-xl bg-emerald-400/5 border border-emerald-400/20 p-8"
            >
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-400 mb-4">
                Why Sports Trading?
              </p>
              <p className="text-white/60 leading-relaxed mb-6">
                Political and economic shocks have little bearing on sports events, making
                bets on them{" "}
                <span className="text-white font-medium">
                  &ldquo;the ultimate uncorrelated asset class.&rdquo;
                </span>
              </p>
              <p className="text-xs text-white/30">— The Economist</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-xl bg-white/5 border border-white/10 p-8"
            >
              <p className="text-sm font-medium uppercase tracking-widest text-white/30 mb-6">
                What Sets Us Apart
              </p>
              <div className="space-y-4">
                {[
                  { label: "Data-Driven", desc: "50+ metrics per team, every game" },
                  { label: "Emotion-Free", desc: "Algorithm decides, not gut feelings" },
                  { label: "Proven Track Record", desc: "15+ years of documented results" },
                  { label: "Transparent Reporting", desc: "Full visibility into every trade" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-white font-medium">{item.label}</span>
                      <span className="text-white/40"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
