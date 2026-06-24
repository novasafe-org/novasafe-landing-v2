import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/landing/Hero";
import { ProductHuntBanner } from "@/components/landing/ProductHuntBanner";
import { CapabilityShowcase } from "@/components/landing/CapabilityShowcase";
import { EncryptionFlow } from "@/components/landing/EncryptionFlow";
import { Features } from "@/components/landing/Features";
import { Ecosystem } from "@/components/landing/Ecosystem";
import { JournalSection } from "@/components/landing/JournalSection";
import { Compliance } from "@/components/landing/Compliance";
import { FaqSection } from "@/components/landing/FaqSection";
import { Stats } from "@/components/landing/Stats";
import { CTA } from "@/components/landing/CTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <ProductHuntBanner />
        <CapabilityShowcase />
        <EncryptionFlow />
        <Features />
        <Ecosystem />
        <JournalSection />
        <Compliance />
        <FaqSection />
        <Stats />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
