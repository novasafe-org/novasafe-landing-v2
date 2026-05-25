import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section, SectionHead, FeatureCard, CTASection, CheckList } from "@/components/site/primitives";
import { Shield, Key, Lock, Server, FileCheck, Eye, Cpu, Globe } from "lucide-react";

const Security = () => (
  <PageShell>
    <PageHero
      eyebrow="Security architecture"
      title={<>Security you can <span className="text-gradient-primary">verify.</span></>}
      lede="Every byte you store in NovaSafe is sealed on your device with keys we never see. This page documents — in plain language — exactly how that works."
    />

    <Section className="!pt-0">
      <SectionHead eyebrow="Architecture" title="Zero-knowledge by design" lede="Encryption happens on your device, before anything leaves it. The server only ever sees opaque ciphertext." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Key, title: "Argon2id key derivation", desc: "Master password is stretched with Argon2id (m=128MiB, t=4, p=2)." },
          { icon: Lock, title: "AES-256-GCM payloads", desc: "All vault items encrypted client-side with authenticated AES-256-GCM." },
          { icon: Shield, title: "X25519 sharing", desc: "Peer-to-peer key wrapping via Curve25519 for sharing without intermediaries." },
          { icon: Cpu, title: "Secure enclave keys", desc: "Hardware-bound device keys on Apple Secure Enclave, Android Keystore, TPM 2.0." },
        ].map((f) => <FeatureCard key={f.title} {...f} />)}
      </div>
    </Section>

    <Section>
      <SectionHead eyebrow="Compliance" title="Independently audited & certified" />
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: "SOC 2 Type II", d: "Annual audit by Big-Four firm." },
          { t: "ISO/IEC 27001", d: "ISMS certified since 2024." },
          { t: "GDPR & CCPA", d: "EU & California compliant DPA." },
          { t: "HIPAA-ready", d: "BAA available for healthcare." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border/70 bg-card/70 p-6 text-center backdrop-blur">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileCheck className="h-6 w-6" /></div>
            <div className="mt-4 text-[15px] font-semibold text-ink">{c.t}</div>
            <p className="mt-1 text-[13px] text-ink-soft">{c.d}</p>
          </div>
        ))}
      </div>
    </Section>

    <Section>
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <div>
          <SectionHead align="left" eyebrow="Infrastructure" title="Hardened, distributed, observable." lede="Multi-region deployment with read replicas in EU, US, and APAC. No single point of failure." />
          <CheckList items={[
            "AWS GovCloud + EU regions, Tier IV datacenters",
            "Customer data isolated per-tenant at the storage layer",
            "Mutual TLS between every internal service",
            "FIPS 140-3 validated cryptography modules",
            "Encrypted backups, 30-day point-in-time recovery",
            "Quarterly penetration tests by independent red teams",
          ]} />
        </div>
        <div className="relative rounded-3xl border border-border/70 bg-card/70 p-8 backdrop-blur">
          <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-wider text-ink-soft"><Server className="h-3.5 w-3.5" /> /api/v1/audit</div>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-[12.5px] text-ink">{`{
  "encryption":  "AES-256-GCM",
  "kdf":         "Argon2id",
  "tls":         "TLS 1.3 + mTLS",
  "key_wrap":    "X25519",
  "audits": [
    { "soc2_type_ii": "2025-Q1", "auditor": "EY" },
    { "iso_27001":    "2024-09", "scope": "global" }
  ],
  "open_source":  true,
  "reproducible": true
}`}</pre>
        </div>
      </div>
    </Section>

    <CTASection title="Read the security whitepaper" lede="A 42-page technical breakdown of NovaSafe's cryptographic architecture, threat model, and operational controls." primary={{ label: "Download whitepaper", to: "/legal/security" }} secondary={{ label: "Talk to security team", to: "/contact" }} />
  </PageShell>
);
export default Security;
