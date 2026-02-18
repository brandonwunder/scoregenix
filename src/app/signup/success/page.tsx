"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function SignupSuccessPage() {
  return (
    <PageShell>
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md text-center"
        >
          <div className="rounded-xl bg-white/5 border border-white/10 p-10">
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10"
            >
              <svg
                className="h-8 w-8 text-emerald-400"
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
            </motion.div>

            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Welcome to{" "}
              <span className="text-emerald-400">Scoregenix</span>!
            </h1>

            <p className="mt-3 text-white/50">
              Your account has been created and your subscription is active.
              You&apos;re ready to start tracking and winning.
            </p>

            <div className="mt-8">
              <Link href="/dashboard">
                <Button className="w-full bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
