import { Smartphone, Cloud, Monitor, Lock, KeyRound } from "lucide-react";

const Node = ({
  icon: Icon,
  label,
  sub,
  accent,
}: {
  icon: typeof Smartphone;
  label: string;
  sub: string;
  accent?: boolean;
}) => (
  <div className="relative flex flex-col items-center gap-3">
    <div
      className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border ${
        accent
          ? "border-primary/40 bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-glow-primary"
          : "border-border bg-card text-ink shadow-card"
      }`}
    >
      <Icon className="h-8 w-8" strokeWidth={1.6} />
      {accent && (
        <span className="absolute -inset-1 -z-10 rounded-2xl bg-primary/30 blur-xl animate-pulse-glow" />
      )}
    </div>
    <div className="text-center">
      <div className="text-[13px] font-semibold text-ink">{label}</div>
      <div className="font-mono text-[11px] text-muted-foreground">{sub}</div>
    </div>
  </div>
);

const FlowLine = ({ label }: { label: string }) => (
  <div className="relative flex flex-1 flex-col items-center justify-center pt-2">
    <svg className="w-full" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="flow-grad" x1="0" x2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <line x1="0" y1="20" x2="200" y2="20" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 4" />
      <line
        x1="0"
        y1="20"
        x2="200"
        y2="20"
        stroke="url(#flow-grad)"
        strokeWidth="2"
        strokeDasharray="40 200"
        className="animate-flow"
      />
    </svg>
    <span className="absolute top-9 rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs">
      {label}
    </span>
  </div>
);

export const EncryptionFlow = () => {
  return (
    <section id="security" className="relative py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
            <Lock className="h-3 w-3" /> The Trust Layer
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Your data is sealed before it ever leaves your device.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Encryption happens locally with keys derived from your master password.
            We see ciphertext — and nothing else.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl rounded-3xl border border-border bg-card/40 p-8 shadow-card backdrop-blur sm:p-12">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5" />

          <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center">
            <Node icon={Smartphone} label="Your device" sub="plaintext" />
            <FlowLine label="encrypt · argon2id" />
            <Node icon={Lock} label="Sealed" sub="ciphertext only" accent />
            <FlowLine label="sync · TLS 1.3" />
            <Node icon={Cloud} label="NovaSafe cloud" sub="opaque blob" />
            <FlowLine label="decrypt · local" />
            <Node icon={Monitor} label="Other devices" sub="plaintext" />
          </div>

          <div className="mt-10 grid gap-4 border-t border-border/70 pt-8 sm:grid-cols-3">
            {[
              { k: "What we store", v: "Encrypted blobs", icon: Cloud },
              { k: "What we can read", v: "Nothing", icon: Lock },
              { k: "Who holds the key", v: "Only you", icon: KeyRound },
            ].map((i) => (
              <div key={i.k} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <i.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
                    {i.k}
                  </div>
                  <div className="text-[15px] font-semibold text-ink">{i.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};