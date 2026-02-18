'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ShieldCheck, CheckCircle2, TrendingUp, Shield, Users } from 'lucide-react';

export function Guarantee() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 sm:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2
            className="text-3xl font-bold text-white sm:text-4xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            We're <span className="text-emerald-400">That Confident</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/50">
            Risk-free for an entire year — because our results speak for themselves
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Guarantee Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Outer glow effect */}
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />

              {/* Main badge */}
              <div className="relative flex h-64 w-64 flex-col items-center justify-center rounded-full border-2 border-emerald-400 bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 p-12 text-center sm:h-80 sm:w-80 sm:p-16">
                {/* Badge icon */}
                <ShieldCheck className="mb-4 h-16 w-16 text-emerald-400" />

                <div
                  className="mb-2 text-5xl font-bold text-white sm:text-6xl"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  12
                </div>
                <div
                  className="mb-1 text-xl font-semibold text-emerald-400 sm:text-2xl"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Months
                </div>
                <div className="text-sm uppercase tracking-wider text-white/60">
                  Money Back
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content & Terms */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3
                className="mb-4 text-2xl font-bold text-white sm:text-3xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Your Subscription Is a{' '}
                <span className="text-emerald-400">Drop in the Bucket</span>
              </h3>
              <p className="text-lg leading-relaxed text-white/60">
                With proven ROI consistently outperforming the market, your subscription cost
                becomes negligible compared to your returns. We're so confident in our
                algorithm's performance that we offer a full year to see the results for
                yourself.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6"
            >
              <h4
                className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                How It Works
              </h4>
              <ul className="space-y-3 text-white/60">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  <span>Subscribe and follow our algorithm's picks for 12 months</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  <span>Execute the trades as recommended (no deviations)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  <span>If you're not profitable, we'll refund your entire subscription</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-xs leading-relaxed text-white/40">
                <span className="font-medium text-white/60">Terms:</span> Guarantee requires
                adherence to all algorithm recommendations without deviation. Refund
                eligibility verified through platform tracking. Elite tier members covered
                under separate managed account agreements.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Bottom: Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {[
            {
              icon: TrendingUp,
              title: '15+ Years',
              desc: 'Proven track record',
            },
            {
              icon: Shield,
              title: '100% Transparent',
              desc: 'Every trade documented',
            },
            {
              icon: Users,
              title: 'Zero Risk',
              desc: 'Full year to profit',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-center transition-colors hover:border-emerald-400/30"
            >
              <div className="mb-3 flex justify-center">
                <item.icon className="h-8 w-8 text-emerald-400" />
              </div>
              <div
                className="mb-1 text-xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {item.title}
              </div>
              <div className="text-sm text-white/40">{item.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
