import { PageShell } from "@/components/layout";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";

export default function Home() {
  return (
    <PageShell>
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <CTA />
    </PageShell>
  );
}
/* Final rebuild 1771407121 */
/* Rebuild after cache purge 1771407356 */
