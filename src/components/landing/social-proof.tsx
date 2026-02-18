"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

/**
 * Publication data for social proof section
 */
const publications = [
  {
    name: "Business Insider",
    logo: "/images/press/Business-Insider.png",
    quote: "Sports Betting is the New Frontier for Wall Street's Smartest Quants to Conquer",
  },
  {
    name: "Financial Times",
    logo: "/images/press/Financial-Times.png",
    quote: "Traders See Sport Betting as a New Asset Class",
  },
  {
    name: "The Economist",
    logo: "/images/press/The-economist.png",
    quote: "Hedge Funds Try to Promote Sports Betting as an Asset Class",
  },
  {
    name: "Grand View Research",
    logo: "/images/press/Grand-View-Research.png",
    quote: "Sports betting market projected to reach $187.4B by 2030",
  },
];

/**
 * SocialProof component displays press publication logos and quotes
 *
 * Features:
 * - Displays 4 major publications (Business Insider, Financial Times, The Economist, Grand View Research)
 * - Grayscale logos with color on hover
 * - Responsive 2x2 grid (mobile) to 4 columns (desktop)
 * - Scroll-triggered animations with Framer Motion
 * - Staggered fade-in animations for each publication
 *
 * @returns Social proof section with press logos and quotes
 */
export function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-16 sm:py-20 border-y border-white/5">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-white/30">
            Wall Street Is Paying Attention
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {publications.map((pub, i) => (
            <motion.div
              key={pub.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <div className="relative h-16 w-full flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-150 group-hover:z-10 group-hover:drop-shadow-2xl transition-all duration-300 cursor-pointer">
                <Image
                  src={pub.logo}
                  alt={pub.name}
                  width={200}
                  height={64}
                  className="object-contain max-h-16"
                  unoptimized
                />
              </div>
              <p className="text-xs text-white/30 leading-snug max-w-[200px] hidden sm:block">
                &ldquo;{pub.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
