"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PlanKey = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

const plans: {
  name: string;
  key: PlanKey;
  price: number;
  period: string;
  description: string;
  highlight: boolean;
  badge?: string;
}[] = [
  {
    name: "Monthly",
    key: "MONTHLY",
    price: 29,
    period: "mo",
    description: "Billed $29/month",
    highlight: false,
  },
  {
    name: "Quarterly",
    key: "QUARTERLY",
    price: 24,
    period: "mo",
    description: "Billed $72/quarter",
    highlight: false,
  },
  {
    name: "Semi-Annual",
    key: "SEMIANNUAL",
    price: 19,
    period: "mo",
    description: "Billed $114/6 months",
    highlight: false,
  },
  {
    name: "Annual",
    key: "ANNUAL",
    price: 14,
    period: "mo",
    description: "Billed $168/year",
    highlight: true,
    badge: "Best Value",
  },
];

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan") as PlanKey | null;
  const cancelled = searchParams.get("cancelled");

  const [step, setStep] = useState<1 | 2>(preselectedPlan ? 2 : 1);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(
    preselectedPlan && plans.some((p) => p.key === preselectedPlan)
      ? preselectedPlan
      : "ANNUAL"
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cancelled) {
      setError("Checkout was cancelled. Please try again.");
    }
  }, [cancelled]);

  function handlePlanSelect(planKey: PlanKey) {
    setSelectedPlan(planKey);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          email,
          name,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const activePlan = plans.find((p) => p.key === selectedPlan);

  return (
    <PageShell>
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {step === 1 ? "Choose Your Plan" : "Create Your Account"}
            </h1>
            <p className="mt-3 text-white/50">
              {step === 1
                ? "Select the plan that fits your betting strategy"
                : `You selected the ${activePlan?.name} plan at $${activePlan?.price}/mo`}
            </p>

            {/* Step indicator */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step >= 1
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10 text-white/40"
                }`}
              >
                1
              </div>
              <div className="h-px w-12 bg-white/20" />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step >= 2
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10 text-white/40"
                }`}
              >
                2
              </div>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 mx-auto max-w-md rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Plan Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {plans.map((plan, i) => (
                  <motion.div
                    key={plan.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 * (i + 1) }}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlanSelect(plan.key)}
                      className={`relative w-full rounded-xl p-5 text-left transition-all ${
                        selectedPlan === plan.key
                          ? "bg-emerald-400/10 border-2 border-emerald-400"
                          : plan.highlight
                            ? "bg-emerald-400/5 border-2 border-emerald-400"
                            : "bg-white/5 border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-black">
                          {plan.badge}
                        </span>
                      )}

                      <h3
                        className="text-base font-semibold text-white"
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {plan.name}
                      </h3>
                      <div className="mt-3">
                        <span
                          className="text-3xl font-bold text-white"
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          ${plan.price}
                        </span>
                        <span className="text-white/40">/{plan.period}</span>
                      </div>
                      <p className="mt-2 text-xs text-white/40">
                        {plan.description}
                      </p>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Step 2: Account Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-md"
              >
                <div className="rounded-xl bg-white/5 border border-white/10 p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/70">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/70">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/70">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Redirecting to checkout..." : "Continue to Payment"}
                    </Button>
                  </form>

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      &larr; Change plan
                    </button>
                    <p className="text-xs text-white/30">
                      Secure checkout via Stripe
                    </p>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-white/40">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
