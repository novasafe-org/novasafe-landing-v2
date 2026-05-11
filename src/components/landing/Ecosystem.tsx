import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Puzzle,
  Smartphone,
  Monitor,
  Terminal,
  Code2,
  ShieldCheck,
  Cloud,
  KeyRound,
  FileLock2,
  Lock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Module = {
  icon: typeof Globe;
  label: string;
  desc: string;
  status?: "live" | "soon";
  /** position on the orbit, in degrees (0 = right, 90 = bottom) */
  angle: number;
  /** which ring (0 = inner, 1 = outer) */
  ring: 0 | 1;
  /** featured badge */
  tag?: string;
};

const modules: Module[] = [
  { icon: Globe, label: "Web App", desc: "Access anywhere", angle: -90, ring: 1, tag: "Universal" },
  { icon: Puzzle, label: "Browser Extension", desc: "Chrome · Edge · Firefox", angle: -30, ring: 1, tag: "Autofill" },
  { icon: Smartphone, label: "Mobile Apps", desc: "iOS & Android · biometric", angle: 30, ring: 1, tag: "Face ID" },
  { icon: Monitor, label: "Desktop App", desc: "macOS & Windows", angle: 90, ring: 1, status: "soon" },
  { icon: Terminal, label: "CLI", desc: "novasafe get · run", angle: 150, ring: 1, tag: "Devs" },
  { icon: Code2, label: "Secrets API", desc: "REST · SDK · Webhooks", angle: 210, ring: 1 },

  { icon: ShieldCheck, label: "Admin Console", desc: "SSO · audit · policy", angle: -45, ring: 0 },
  { icon: Cloud, label: "Encrypted Sync", desc: "End-to-end · real-time", angle: 45, ring: 0 },
  { icon: KeyRound, label: "Password Vault", desc: "Passwords & passkeys", angle: 135, ring: 0 },
  { icon: FileLock2, label: "Document Vault", desc: "Files · notes · secrets", angle: 225, ring: 0 },
];

export const Ecosystem = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      setTilt({ x, y });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      id="ecosystem"
      className="relative overflow-hidden bg-[hsl(224_47%_5%)] py-32 text-[hsl(210_40%_98%)]"
    >
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.9]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(222 89% 55% / 0.22), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, hsl(220 95% 65% / 0.10), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(210 40% 98% / 1) 1px, transparent 1px), linear-gradient(to bottom, hsl(210 40% 98% / 1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 80%)",
          }}
        />
        {/* particles */}
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-[hsl(220_95%_75%)]"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              opacity: 0.25 + ((i % 5) * 0.1),
              animation: `float ${6 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
              boxShadow: "0 0 8px hsl(220 95% 75% / 0.7)",
            }}
          />
        ))}
      </div>

      <div className="container relative">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(220_95%_65%/0.3)] bg-[hsl(222_89%_55%/0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(220_95%_75%)] backdrop-blur">
            <Sparkles className="h-3 w-3" /> The Ecosystem
          </span>
          <h2 className="mt-6 text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            One Secure Ecosystem.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, hsl(220 100% 88%), hsl(220 95% 65%))",
              }}
            >
              Everywhere you work.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[hsl(215_20%_75%)]">
            One encrypted core powers every surface — from browser to CLI to enterprise. Move
            seamlessly. Stay sealed.
          </p>
        </div>

        {/* Stage */}
        <div
          ref={ref}
          className="relative mx-auto mt-24 aspect-square w-full max-w-[860px]"
          style={{ perspective: "1400px" }}
        >
          <div
            className="relative h-full w-full transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `rotateX(${tilt.y * -8}deg) rotateY(${tilt.x * 10}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Concentric rings */}
            <Ring sizePct={100} />
            <Ring sizePct={74} dashed />
            <Ring sizePct={48} dashed />

            {/* Connection lines */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="-200 -200 400 400"
              fill="none"
            >
              <defs>
                <radialGradient id="lineGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(220 95% 75%)" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="hsl(220 95% 75%)" stopOpacity="0" />
                </radialGradient>
              </defs>
              {modules.map((m, i) => {
                const r = m.ring === 0 ? 95 : 175;
                const rad = (m.angle * Math.PI) / 180;
                const x = Math.cos(rad) * r;
                const y = Math.sin(rad) * r;
                return (
                  <g key={i}>
                    <line
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke="url(#lineGrad)"
                      strokeWidth="1"
                    />
                    <line
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke="hsl(220 95% 75%)"
                      strokeOpacity="0.7"
                      strokeWidth="1.2"
                      strokeDasharray="4 220"
                      style={{
                        animation: `flow ${4 + (i % 4)}s linear ${i * 0.25}s infinite`,
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Encrypted core */}
            <Core />

            {/* Modules */}
            {modules.map((m, i) => {
              const r = m.ring === 0 ? 23.5 : 43.5; // % of stage
              const rad = (m.angle * Math.PI) / 180;
              const x = 50 + Math.cos(rad) * r;
              const y = 50 + Math.sin(rad) * r;
              return (
                <ModuleCard
                  key={i}
                  m={m}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    animation: `float ${7 + (i % 4)}s ease-in-out ${i * 0.35}s infinite`,
                    transform: `translate(-50%, -50%) translateZ(${m.ring === 0 ? 40 : 20}px)`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom signal row */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12.5px] text-[hsl(215_20%_70%)]">
          <Pill dot>End-to-end encrypted sync</Pill>
          <Pill>AES-256 · ChaCha20-Poly1305</Pill>
          <Pill>Zero-knowledge architecture</Pill>
          <Pill>SOC 2 · ISO 27001</Pill>
        </div>
      </div>
    </section>
  );
};

const Ring = ({ sizePct, dashed }: { sizePct: number; dashed?: boolean }) => (
  <div
    className={cn(
      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
      dashed ? "border border-dashed" : "border",
    )}
    style={{
      width: `${sizePct}%`,
      height: `${sizePct}%`,
      borderColor: "hsl(220 60% 70% / 0.14)",
    }}
  />
);

const Core = () => (
  <div
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    style={{ transform: "translate(-50%, -50%) translateZ(80px)" }}
  >
    {/* outer halo */}
    <div
      className="absolute -inset-24 rounded-full blur-3xl"
      style={{
        background:
          "radial-gradient(circle, hsl(222 89% 55% / 0.55), transparent 60%)",
        animation: "pulse-glow 4s ease-in-out infinite",
      }}
    />
    {/* glass orb */}
    <div
      className="relative flex h-44 w-44 items-center justify-center rounded-[2rem] border border-[hsl(220_95%_75%/0.35)]"
      style={{
        background:
          "linear-gradient(160deg, hsl(222 89% 55% / 0.85), hsl(224 76% 30% / 0.9))",
        boxShadow:
          "inset 0 1px 0 hsl(220 100% 90% / 0.4), inset 0 -20px 40px hsl(224 76% 18% / 0.6), 0 30px 80px -10px hsl(222 89% 55% / 0.6), 0 0 0 1px hsl(220 95% 75% / 0.15)",
        animation: "float 6s ease-in-out infinite",
      }}
    >
      {/* inner facets */}
      <div
        className="absolute inset-3 rounded-[1.5rem] border border-[hsl(220_100%_90%/0.18)]"
        style={{
          background:
            "linear-gradient(140deg, hsl(220 100% 90% / 0.18), transparent 50%)",
        }}
      />
      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
        <div
          className="absolute -inset-x-10 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(220 100% 95% / 0.8), transparent)",
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="rounded-2xl border border-[hsl(220_100%_90%/0.25)] bg-[hsl(224_47%_5%/0.35)] p-3 backdrop-blur">
          <Lock className="h-7 w-7 text-[hsl(220_100%_92%)]" strokeWidth={1.6} />
        </div>
        <div className="mt-3 text-[12.5px] font-semibold tracking-tight text-[hsl(220_100%_96%)]">
          Encrypted Core
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(220_100%_88%/0.7)]">
          zero-knowledge
        </div>
      </div>
    </div>
  </div>
);

const ModuleCard = ({
  m,
  style,
}: {
  m: Module;
  style: React.CSSProperties;
}) => {
  const Icon = m.icon;
  return (
    <div
      className="group absolute w-[176px] -translate-x-1/2 -translate-y-1/2"
      style={style}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-[hsl(220_60%_70%/0.18)] bg-[hsl(224_42%_8%/0.7)] p-3.5 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[hsl(220_95%_75%/0.5)]"
        style={{
          boxShadow:
            "inset 0 1px 0 hsl(220 100% 90% / 0.06), 0 18px 40px -20px hsl(224 47% 2% / 0.8)",
        }}
      >
        {/* sheen */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(220 100% 95% / 0.4), transparent)",
          }}
        />
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[hsl(220_95%_75%/0.25)]"
            style={{
              background:
                "linear-gradient(160deg, hsl(222 89% 55% / 0.35), hsl(224 76% 30% / 0.4))",
              boxShadow:
                "inset 0 1px 0 hsl(220 100% 95% / 0.2), 0 0 20px hsl(222 89% 55% / 0.35)",
            }}
          >
            <Icon className="h-4 w-4 text-[hsl(220_100%_92%)]" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-[12.5px] font-semibold text-[hsl(210_40%_98%)]">
                {m.label}
              </div>
              {m.status === "soon" && (
                <span className="rounded-full border border-[hsl(220_95%_75%/0.3)] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-wider text-[hsl(220_95%_80%)]">
                  Soon
                </span>
              )}
            </div>
            <div className="truncate text-[10.5px] text-[hsl(215_20%_70%)]">
              {m.desc}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pill = ({
  children,
  dot,
}: {
  children: React.ReactNode;
  dot?: boolean;
}) => (
  <span className="inline-flex items-center gap-2">
    {dot && (
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(152_70%_50%)] opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(152_70%_50%)]" />
      </span>
    )}
    {children}
  </span>
);

export default Ecosystem;