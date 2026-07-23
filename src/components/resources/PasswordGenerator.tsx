import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Shield,
  Lock,
  KeyRound,
  Sparkles,
  Zap,
  Globe,
  Fingerprint,
  Smartphone,
  Puzzle,
  StickyNote,
  CreditCard,
  Terminal,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  KeySquare,
  FileKey,
  Building2,
  Wifi,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { buildSignupUrl, LANDING_ROUTES } from "@/config";
import {
  analyzeDictionary,
  analyzeKeyboard,
  analyzeRepeats,
  analyzeSequence,
  calcEntropy,
  crackTime,
  generatePassphrase,
  generatePassword,
  strengthLabel,
  type PhraseOptions,
  type PwOptions,
} from "./password-generator-utils";

function strengthBarClass(color: "danger" | "warning" | "brand" | "success") {
  if (color === "danger") return "bg-destructive";
  if (color === "warning") return "bg-amber-500";
  if (color === "brand") return "bg-primary";
  return "bg-success";
}

export function PasswordGenerator() {
  const [mode, setMode] = useState<"password" | "passphrase">("password");
  const [opts, setOpts] = useState<PwOptions>({
    length: 20,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    noRepeat: false,
    requireAll: true,
  });
  const [phraseOpts, setPhraseOpts] = useState<PhraseOptions>({
    words: 4,
    separator: "-",
    capitalize: false,
    includeNumber: false,
    includeSymbol: false,
  });
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [anim, setAnim] = useState(0);

  const regen = useCallback(() => {
    const p = mode === "password" ? generatePassword(opts) : generatePassphrase(phraseOpts);
    setPassword(p);
    setAnim((a) => a + 1);
  }, [mode, opts, phraseOpts]);

  useEffect(() => {
    regen();
  }, [regen]);

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const entropy = useMemo(() => calcEntropy(password), [password]);
  const strength = strengthLabel(entropy);
  const time = crackTime(entropy);

  const analysis = useMemo(
    () => ({
      upper: (password.match(/[A-Z]/g) || []).length,
      lower: (password.match(/[a-z]/g) || []).length,
      numbers: (password.match(/[0-9]/g) || []).length,
      symbols: (password.match(/[^a-zA-Z0-9]/g) || []).length,
      sequential: analyzeSequence(password),
      repeats: analyzeRepeats(password),
      keyboard: analyzeKeyboard(password),
      dictionary: analyzeDictionary(password),
    }),
    [password],
  );

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl opacity-70" />
          <div className="absolute right-[-10%] top-40 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl opacity-60" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-6 sm:px-8 sm:pb-16 sm:pt-10">
          <div className="mx-auto max-w-3xl animate-fade-in text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-3 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Runs entirely in your browser · Zero-knowledge
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-[68px]">
              Generate strong passwords{" "}
              <span className="text-gradient-primary">hackers can&apos;t guess</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              A secure, random password generator built by the team behind NovaSafe. No tracking. No storage.
              Everything happens in your browser.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <div className="rounded-[28px] border border-border/70 bg-card p-2 shadow-elevated">
              <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
                <div className="inline-flex rounded-full border border-border/70 bg-secondary p-1 text-sm">
                  {(["password", "passphrase"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "rounded-full px-4 py-1.5 font-medium capitalize transition-all",
                        mode === m
                          ? "bg-card text-ink shadow-card"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="hidden items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success sm:flex">
                  <ShieldCheck className="h-3.5 w-3.5" /> Cryptographically secure
                </div>
              </div>

              <div className="mx-3 mt-2 rounded-[20px] border border-border/70 bg-secondary/60 p-5 sm:p-7">
                <div className="flex min-h-[72px] items-center">
                  <div
                    key={anim}
                    className="animate-fade-up w-full break-all font-mono text-xl font-medium tracking-tight sm:text-2xl md:text-[28px]"
                    style={{ WebkitTextSecurity: visible ? "none" : "disc" } as React.CSSProperties}
                  >
                    {password || "\u00a0"}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full", strengthBarClass(strength.color))} />
                      <span className="font-medium text-foreground">{strength.label}</span>
                    </span>
                    <span className="font-mono">
                      {entropy} bits · {time}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", strengthBarClass(strength.color))}
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={regen}
                  className="group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-medium text-background shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow-primary active:translate-y-0 sm:flex-none"
                >
                  <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180" />
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={copy}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-medium transition-all hover:-translate-y-0.5 sm:flex-none",
                    copied
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border/70 bg-card text-foreground hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  aria-label={visible ? "Hide password" : "Show password"}
                  className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-2xl border border-border/70 bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              <div className="rounded-[24px] border border-border/70 bg-card p-6 shadow-card sm:p-8 lg:col-span-3">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {mode === "password" ? "Password options" : "Passphrase options"}
                </h3>

                {mode === "password" ? (
                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="mb-3 flex items-baseline justify-between">
                        <Label className="text-sm font-medium">Length</Label>
                        <span className="font-mono text-2xl font-semibold tabular-nums">{opts.length}</span>
                      </div>
                      <Slider
                        min={8}
                        max={64}
                        step={1}
                        value={[opts.length]}
                        onValueChange={([v]) => setOpts((o) => ({ ...o, length: v }))}
                        aria-label="Password length"
                      />
                      <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
                        <span>8</span>
                        <span>16</span>
                        <span>32</span>
                        <span>48</span>
                        <span>64</span>
                      </div>
                    </div>

                    <div className="grid gap-1 sm:grid-cols-2">
                      <ToggleRow label="Uppercase (A–Z)" checked={opts.upper} onChange={(v) => setOpts((o) => ({ ...o, upper: v }))} />
                      <ToggleRow label="Lowercase (a–z)" checked={opts.lower} onChange={(v) => setOpts((o) => ({ ...o, lower: v }))} />
                      <ToggleRow label="Numbers (0–9)" checked={opts.numbers} onChange={(v) => setOpts((o) => ({ ...o, numbers: v }))} />
                      <ToggleRow label="Symbols (!@#$)" checked={opts.symbols} onChange={(v) => setOpts((o) => ({ ...o, symbols: v }))} />
                      <ToggleRow label="Exclude similar (i, l, 1, L, o, 0, O)" checked={opts.excludeSimilar} onChange={(v) => setOpts((o) => ({ ...o, excludeSimilar: v }))} />
                      <ToggleRow label="Exclude ambiguous ({ } [ ] ...)" checked={opts.excludeAmbiguous} onChange={(v) => setOpts((o) => ({ ...o, excludeAmbiguous: v }))} />
                      <ToggleRow label="No repeated characters" checked={opts.noRepeat} onChange={(v) => setOpts((o) => ({ ...o, noRepeat: v }))} />
                      <ToggleRow label="Must include every type" checked={opts.requireAll} onChange={(v) => setOpts((o) => ({ ...o, requireAll: v }))} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="mb-3 flex items-baseline justify-between">
                        <Label className="text-sm font-medium">Word count</Label>
                        <span className="font-mono text-2xl font-semibold tabular-nums">{phraseOpts.words}</span>
                      </div>
                      <Slider
                        min={3}
                        max={10}
                        step={1}
                        value={[phraseOpts.words]}
                        onValueChange={([v]) => setPhraseOpts((o) => ({ ...o, words: v }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Separator</Label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { v: "-", n: "Dash" },
                          { v: ".", n: "Dot" },
                          { v: "_", n: "Underscore" },
                          { v: " ", n: "Space" },
                          { v: "", n: "None" },
                        ].map((s) => (
                          <button
                            key={s.n}
                            type="button"
                            onClick={() => setPhraseOpts((o) => ({ ...o, separator: s.v }))}
                            className={cn(
                              "rounded-full border px-4 py-1.5 text-sm transition-all",
                              phraseOpts.separator === s.v
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                            )}
                          >
                            {s.n} {s.v && <span className="font-mono opacity-60">{s.v}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      <ToggleRow label="Capitalize words" checked={phraseOpts.capitalize} onChange={(v) => setPhraseOpts((o) => ({ ...o, capitalize: v }))} />
                      <ToggleRow label="Include number" checked={phraseOpts.includeNumber} onChange={(v) => setPhraseOpts((o) => ({ ...o, includeNumber: v }))} />
                      <ToggleRow label="Include symbol" checked={phraseOpts.includeSymbol} onChange={(v) => setPhraseOpts((o) => ({ ...o, includeSymbol: v }))} />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-border/70 bg-card p-6 shadow-card sm:p-8 lg:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Password analysis</h3>

                <div className="mt-6 space-y-5">
                  <StatRow label="Entropy" value={`${entropy} bits`} />
                  <StatRow label="Est. crack time" value={time} />
                  <StatRow label="Length" value={String(password.length)} />

                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Character mix</div>
                    <div className="grid grid-cols-4 gap-2">
                      <MixCell label="ABC" v={analysis.upper} />
                      <MixCell label="abc" v={analysis.lower} />
                      <MixCell label="123" v={analysis.numbers} />
                      <MixCell label="!@#" v={analysis.symbols} />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Patterns detected</div>
                    <div className="space-y-1.5">
                      <PatternRow ok={!analysis.dictionary} label="Dictionary words" />
                      <PatternRow ok={!analysis.repeats} label="Repeated characters" />
                      <PatternRow ok={!analysis.keyboard} label="Keyboard patterns" />
                      <PatternRow ok={!analysis.sequential} label="Sequential characters" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> AES-256 · XChaCha20
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> SOC 2 ready
            </span>
            <span className="flex items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5" /> Zero-knowledge
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> No credit card
            </span>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-surface-1/40">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-primary">
              <KeyRound className="h-3.5 w-3.5" /> Password security 101
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              What makes a password actually secure?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
              Length beats complexity. Randomness beats cleverness. And a password you can&apos;t remember is safer than
              one you can — as long as you store it right.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <EduCard
              n="01"
              title="Length is everything"
              body="Every character you add multiplies the guesses required by up to 90×. A 20-character random password would take longer than the age of the universe to crack."
            />
            <EduCard
              n="02"
              title="Randomness matters more than symbols"
              body="'P@ssw0rd!' is weaker than 'river-forest-orange'. Human patterns are predictable — cryptographic randomness is not."
            />
            <EduCard
              n="03"
              title="Passwords vs. passkeys"
              body="Passkeys replace passwords with cryptographic key pairs bound to your device. Phishing-proof by design, and NovaSafe stores them alongside your vault."
            />
            <EduCard
              n="04"
              title="Entropy, explained"
              body="Entropy measures unpredictability in bits. 128 bits is uncrackable with today's computing. Every bit doubles the effort required."
            />
            <EduCard
              n="05"
              title="Reuse is the real risk"
              body="One breached site becomes a breach of every account sharing that password. Unique passwords contain the blast radius."
            />
            <EduCard
              n="06"
              title="Storage is a solved problem"
              body="A zero-knowledge password manager encrypts everything on your device before it syncs. Only you hold the key that unlocks it."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Best practices
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              Habits that keep your accounts safe.
            </h2>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: KeySquare, title: "Never reuse passwords", body: "One unique password per site — always." },
              { icon: FileKey, title: "Store passwords securely", body: "Use an encrypted vault, never a spreadsheet or notes app." },
              { icon: Smartphone, title: "Enable multi-factor auth", body: "Add a second layer with an authenticator app." },
              { icon: Fingerprint, title: "Prefer passkeys", body: "When available, passkeys are phishing-proof by design." },
              { icon: RotateCcw, title: "Rotate exposed credentials", body: "Change any password that appears in a breach immediately." },
              { icon: Wifi, title: "Keep software updated", body: "Patches close the vulnerabilities attackers rely on." },
            ].map((t) => (
              <div
                key={t.title}
                className="group rounded-2xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <t.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-base font-semibold">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-surface-1/40">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Why NovaSafe
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              A home for the passwords you just created.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
              Generating a strong password is step one. Storing it in a vault only you can open is step two.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, title: "Zero-knowledge encryption", body: "Everything is encrypted on your device before it leaves. We literally can't read your vault.", href: LANDING_ROUTES.security },
              { icon: KeyRound, title: "Passwords", body: "Autofill across every device. Import from any manager in one click.", href: "/features/password-manager" },
              { icon: Fingerprint, title: "Passkeys", body: "Store and sync FIDO2 passkeys alongside your passwords.", href: "/features/passkeys" },
              { icon: Shield, title: "Authenticator", body: "Built-in TOTP codes so 2FA lives right next to the account it protects.", href: LANDING_ROUTES.features },
              { icon: StickyNote, title: "Secure notes", body: "Encrypted notes for recovery codes, WiFi passwords, and anything private.", href: LANDING_ROUTES.features },
              { icon: CreditCard, title: "Payment cards", body: "Autofill checkout without exposing your card details to a website.", href: LANDING_ROUTES.features },
              { icon: Terminal, title: "SSH & API keys", body: "A dedicated vault for infrastructure secrets and developer credentials.", href: LANDING_ROUTES.features },
              { icon: Globe, title: "Encrypted sync", body: "Every device stays in sync — over an end-to-end encrypted channel.", href: LANDING_ROUTES.features },
              { icon: Puzzle, title: "Browser extension", body: "One-click autofill in Chrome, Safari, Firefox, Arc, and Edge.", href: LANDING_ROUTES.features },
              { icon: Smartphone, title: "Mobile apps", body: "Native iOS and Android with Face ID and biometric unlock.", href: LANDING_ROUTES.features },
              { icon: Zap, title: "Cross-device access", body: "Your vault opens the same on every device you own.", href: LANDING_ROUTES.features },
              { icon: Building2, title: "Enterprise-ready", body: "SSO, SCIM, and audit logs for teams. Coming soon.", href: LANDING_ROUTES.pricing },
            ].map((f) => (
              <Link
                key={f.title}
                to={f.href}
                className="group flex flex-col rounded-2xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/70">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-card via-primary/5 to-primary/10 p-10 text-center shadow-elevated sm:p-16">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-glow-primary">
                <Lock className="h-6 w-6" strokeWidth={2} />
              </div>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                Ready to keep every password secure?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                Create your free NovaSafe vault. Import your existing passwords in seconds — encrypted end-to-end, only
                you can open it.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={buildSignupUrl({ ref: "password_generator_cta" })}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-background shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow-primary sm:w-auto"
                >
                  Create free vault <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <Link
                  to={LANDING_ROUTES.features}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-card/70 px-6 py-3.5 text-sm font-medium text-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary sm:w-auto"
                >
                  <Puzzle className="h-4 w-4" /> Explore features
                </Link>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">Free forever · No credit card · End-to-end encrypted</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-secondary">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
    </label>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/70 pb-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function MixCell({ label, v }: { label: string; v: number }) {
  const active = v > 0;
  return (
    <div
      className={cn(
        "rounded-xl border p-2.5 text-center transition-colors",
        active ? "border-primary/30 bg-primary/10" : "border-border/70 bg-secondary/60",
      )}
    >
      <div className={cn("font-mono text-xs", active ? "text-primary" : "text-muted-foreground")}>{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold tabular-nums", active ? "text-foreground" : "text-muted-foreground/60")}>
        {v}
      </div>
    </div>
  );
}

function PatternRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {ok ? (
        <span className="inline-flex items-center gap-1 text-success">
          <Check className="h-3.5 w-3.5" /> None
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" /> Found
        </span>
      )}
    </div>
  );
}

function EduCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-7 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card">
      <div className="font-mono text-xs font-semibold text-primary">{n}</div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
