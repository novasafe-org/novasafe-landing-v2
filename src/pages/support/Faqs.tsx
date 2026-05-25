import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, FAQ } from "@/components/site/primitives";

export default () => (
  <PageShell>
    <PageHero eyebrow="FAQs" title="Frequently asked questions" lede="Quick answers to the things people ask most." />
    <Section className="!pt-0">
      <FAQ items={[
        { q: "Is NovaSafe really zero-knowledge?", a: "Yes. Your master password never leaves your device. Vault contents are encrypted client-side with keys we never see." },
        { q: "What happens if I forget my master password?", a: "Because we cannot recover it for you, NovaSafe offers recovery codes, emergency contacts, and hardware-key fallback options. Set them up during onboarding." },
        { q: "Which devices do you support?", a: "Native apps for iOS, Android, macOS, Windows, and Linux. Browser extensions for Chrome, Safari, Firefox, Edge, Brave, and Arc. A full-fidelity web vault is also available." },
        { q: "Can I import from 1Password, LastPass, Bitwarden, Dashlane?", a: "Yes — guided importers exist for each. See /docs/migration for step-by-step guides." },
        { q: "How much does NovaSafe cost?", a: "Personal is free forever. Premium is $3.99/month or ₹149/month with annual discounts. Business and Enterprise are custom-priced." },
        { q: "Do you have an open-source version?", a: "Our cryptographic primitives, SDKs, and CLI are open source. The server is closed source but reproducibly built — see /open-source." },
        { q: "Is NovaSafe SOC 2 compliant?", a: "Yes — SOC 2 Type II audited annually with zero findings. ISO 27001 certified. Reports available under NDA." },
        { q: "Can I self-host?", a: "Enterprise customers can deploy NovaSafe in a private VPC or on-prem with our control-plane license. Contact sales for details." },
      ]} />
    </Section>
  </PageShell>
);
