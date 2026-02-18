"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { testimonials } from "@/data/testimonials";

/**
 * Testimonials section component for the landing page.
 * Displays customer testimonials in a responsive grid layout with
 * scroll-triggered staggered animations.
 *
 * Features:
 * - 3x2 grid of testimonial cards (responsive: 1 col mobile, 2 col sm, 3 col lg)
 * - Quote icon, quote text, name/location with avatar initial
 * - Framer Motion scroll-triggered staggered reveal animations
 * - Disclaimer footer about testimonials
 *
 * @returns A section element containing testimonials grid
 */
export function Testimonials() {
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
            What Our Subscribers{" "}
            <span className="text-emerald-400">Say</span>
          </h2>
          <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
            Real feedback from real investors
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * (i + 1) }}
              className="rounded-xl bg-white/5 border border-white/10 p-6 hover:border-emerald-400/20 transition-colors"
            >
              <svg
                className="h-8 w-8 text-emerald-400/30 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-white/60 leading-relaxed text-sm mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="h-8 w-8 rounded-full bg-emerald-400/10 flex items-center justify-center">
                  <span className="text-emerald-400 text-xs font-bold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{testimonial.name}</p>
                  <p className="text-white/30 text-xs">{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/20">
          *Testimonials reflect individual experiences and are not guaranteed. No testimonial provider was compensated.
        </p>
      </div>
    </section>
  );
}
