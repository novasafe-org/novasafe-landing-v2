import { PageShell } from "@/components/site/PageShell";
import { PageHero, Section } from "@/components/site/primitives";

const entries = [
  {
    v: "2026.6",
    d: "May 28, 2026",
    title: "Faster vault UX and stricter session handling",
    items: [
      "Removed dummy-data flashes and added first-load skeletons in Vault.",
      "Prevented cross-account data flashes by clearing persisted vault state on logout/user switch.",
      "Auth routes are now guest-only when already signed in (redirect to app).",
      "Web sessions now expire after 30 minutes with forced logout redirect.",
      "Improved item creation UX: save button now shows loading and is disabled while API is pending.",
    ],
  },
  // { v: "2026.5", d: "May 18, 2026", title: "Reproducible client builds", items: ["macOS & Linux clients now reproducible bit-for-bit","New transparency log at transparency.novasafe.app","SDK 4.2: streaming secret reads"] },
  // { v: "2026.4", d: "Apr 02, 2026", title: "Passkey sharing GA", items: ["Share passkeys with teammates (still phishing-resistant)","Audit log retention extended to 7 years on Enterprise","New: APAC region (ap-southeast-1)"] },
  // { v: "2026.3", d: "Mar 10, 2026", title: "Hardware key fallback", items: ["YubiKey 5 & Titan as secondary unlock factor","Faster sync — 38% median latency reduction","CLI 1.8: novasafe diff for env files"] },
  // { v: "2026.2", d: "Feb 04, 2026", title: "SOC 2 Type II 2025 report", items: ["No findings, second consecutive year","New compliance portal at /compliance","ISO 27017 cloud-services scope added"] },
];

export default () => (
  <PageShell>
    <PageHero eyebrow="Changelog" title={<>What's new in <span className="text-gradient-primary">NovaSafe.</span></>} lede="Shipped, not promised. Subscribe via RSS or follow @novasafe for live updates." />
    <Section className="!pt-0">
      <div className="mx-auto max-w-3xl space-y-10">
        {entries.map((e) => (
          <article key={e.v} className="rounded-2xl border border-border/70 bg-card/70 p-8 backdrop-blur">
            <div className="flex items-center gap-3 text-[12px] font-mono uppercase tracking-wider text-ink-soft">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">v{e.v}</span>
              <span>{e.d}</span>
            </div>
            <h2 className="mt-3 text-[22px] font-semibold text-ink">{e.title}</h2>
            <ul className="mt-4 ml-5 list-disc space-y-1.5 text-[14.5px] text-ink-soft">
              {e.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  </PageShell>
);
