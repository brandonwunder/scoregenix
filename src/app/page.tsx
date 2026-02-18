import { PageShell } from "@/components/layout";
import { Hero } from "@/components/landing/hero";
import { SocialProof } from "@/components/landing/social-proof";
import { Story } from "@/components/landing/story";
import { TrackRecord } from "@/components/landing/track-record";
import { Testimonials } from "@/components/landing/testimonials";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Guarantee } from "@/components/landing/guarantee";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";

export default function Home() {
  return (
    <PageShell>
      <Hero />
      <TrackRecord />
      <Story />
      <Testimonials />
      <HowItWorks />
      <Guarantee />
      <Pricing />
      <SocialProof />
      <CTA />
    </PageShell>
  );
}
/* Final rebuild 1771407121 */
/* Rebuild after cache purge 1771407356 */
