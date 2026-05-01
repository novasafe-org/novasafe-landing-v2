import { Globe, Smartphone, Puzzle, Terminal, Server, ShieldCheck } from "lucide-react";

const nodes = [
  { icon: Globe, label: "Web app", desc: "Any modern browser", angle: -90 },
  { icon: Smartphone, label: "iOS & Android", desc: "Biometric unlock", angle: -30 },
  { icon: Puzzle, label: "Browser extension", desc: "Chrome · Firefox · Safari", angle: 30 },
  { icon: Terminal, label: "CLI", desc: "novasafe get / set", angle: 90 },
  { icon: Server, label: "Secrets API", desc: "REST · gRPC", angle: 150 },
  { icon: ShieldCheck, label: "Admin console", desc: "Policy · audit · SSO", angle: 210 },
];

export const Platforms = () => {
  return (
    <section id="platforms" className="relative overflow-hidden py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary">
            One vault · everywhere
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            A connected ecosystem, not a toolbox.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Six surfaces, one encrypted core. Switch contexts without losing security.
          </p>
        </div>

        <div className="relative mx-auto mt-20 flex aspect-square max-w-[640px] items-center justify-center">
          {/* Concentric rings */}
          <div className="absolute inset-0 rounded-full border border-dashed border-border/70" />
          <div className="absolute inset-[12%] rounded-full border border-dashed border-border/60" />
          <div className="absolute inset-[28%] rounded-full border border-dashed border-border/50" />

          {/* Glow */}
          <div className="absolute inset-[28%] rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/10 blur-2xl animate-pulse-glow" />

          {/* Center hub */}
          <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-3xl border border-primary/30 bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-glow-primary">
            <ShieldCheck className="h-8 w-8" strokeWidth={1.6} />
            <span className="mt-1.5 text-[11.5px] font-semibold tracking-tight">Encrypted core</span>
            <span className="font-mono text-[9.5px] opacity-80">zero-knowledge</span>
          </div>

          {/* Connection lines */}
          <svg className="absolute inset-0 h-full w-full" viewBox="-200 -200 400 400">
            {nodes.map((n, i) => {
              const r = 170;
              const rad = (n.angle * Math.PI) / 180;
              const x = Math.cos(rad) * r;
              const y = Math.sin(rad) * r;
              return (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.18"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
              );
            })}
          </svg>

          {/* Orbital nodes */}
          {nodes.map((n, i) => {
            const r = 50; // % of container
            const rad = (n.angle * Math.PI) / 180;
            const x = 50 + Math.cos(rad) * r;
            const y = 50 + Math.sin(rad) * r;
            return (
              <div
                key={i}
                className="group absolute flex w-[150px] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${x}%`, top: `${y}%`, animation: `float 6s ease-in-out ${i * 0.3}s infinite` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-card transition-all group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg">
                  <n.icon className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <div className="mt-2 text-center">
                  <div className="text-[12.5px] font-semibold text-ink">{n.label}</div>
                  <div className="text-[10.5px] text-muted-foreground">{n.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};