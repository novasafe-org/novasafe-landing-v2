import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { EncryptionFlow } from "@/components/landing/EncryptionFlow";
import { Features } from "@/components/landing/Features";
import { Ecosystem } from "@/components/landing/Ecosystem";
import { Compliance } from "@/components/landing/Compliance";
import { Developers } from "@/components/landing/Developers";
import { Stats } from "@/components/landing/Stats";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <EncryptionFlow />
        <Features />
        <Ecosystem />
        <Compliance />
        <Developers />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
