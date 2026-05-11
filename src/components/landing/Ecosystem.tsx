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
  Check,
  Wifi,
  Activity,
  Fingerprint,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                  Module data                               */
/* -------------------------------------------------------------------------- */

type Preview = "browser" | "extension" | "mobile" | "desktop" | "cli" | "api" | "admin" | "sync" | "passwords" | "documents";

type Module = {
  icon: typeof Globe;
  label: string;
  desc: string;
  status?: "live" | "soon";
  /** angle on the orbit (degrees, 0=right, 90=down) */
  angle: number;
  /** orbit ring: 0 = inner (closer/larger), 1 = outer (farther/smaller) */
  ring: 0 | 1;
  /** translate-Z in px for depth feel */
  depth: number;
  preview: Preview;
};

const modules: Module[] = [
  // OUTER ring — product surfaces
  { icon: Globe,      label: "Web App",           desc: "Access anywhere",        angle: -100, ring: 1, depth: 30,  preview: "browser" },
  { icon: Puzzle,     label: "Browser Extension", desc: "Chrome · Edge · Firefox", angle: -40,  ring: 1, depth: 60,  preview: "extension" },
  { icon: Smartphone, label: "Mobile Apps",       desc: "iOS · Android",           angle: 20,   ring: 1, depth: 90,  preview: "mobile" },
  { icon: Monitor,    label: "Desktop App",       desc: "macOS · Windows",         angle: 80,   ring: 1, depth: 50, preview: "desktop", status: "soon" },
  { icon: Terminal,   label: "CLI",               desc: "novasafe run · get",      angle: 140,  ring: 1, depth: 25,  preview: "cli" },
  { icon: Code2,      label: "Secrets API",       desc: "REST · SDK · Webhooks",   angle: 200,  ring: 1, depth: 70,  preview: "api" },

  // INNER ring — capabilities / control plane
  { icon: ShieldCheck, label: "Admin Console",    desc: "SSO · audit · policy",    angle: -55,  ring: 0, depth: 110, preview: "admin" },
  { icon: Cloud,       label: "Encrypted Sync",   desc: "End-to-end · real-time",  angle: 55,   ring: 0, depth: 130, preview: "sync" },
  { icon: KeyRound,    label: "Password Vault",   desc: "Passwords & passkeys",    angle: 125,  ring: 0, depth: 130, preview: "passwords" },
  { icon: FileLock2,   label: "Document Vault",   desc: "Files · notes · secrets", angle: 235,  ring: 0, depth: 110, preview: "documents" },
];

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export const Ecosystem = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 35 });

  useEffect(() => {
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!stage || !section) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sr = section.getBoundingClientRect();
        setLight({
          x: ((e.clientX - sr.left) / sr.width) * 100,
          y: ((e.clientY - sr.top) / sr.height) * 100,
        });
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        setTilt({ x, y });
      });
    };
    const onLeave = () => {
      setTilt({ x: 0, y: 0 });
      setLight({ x: 50, y: 35 });
    };
    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ecosystem"
      className="relative overflow-hidden bg-[hsl(224_50%_4%)] py-36 text-[hsl(210_40%_98%)]"
    >
      <Atmosphere lightX={light.x} lightY={light.y} />

      <div className="container relative">
        {/* ---------------------------------- Header ---------------------------------- */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(220_95%_75%/0.18)] bg-[hsl(222_89%_55%/0.08)] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[hsl(220_100%_88%)] backdrop-blur">
            <Sparkles className="h-3 w-3" /> The Ecosystem
          </span>
          <h2 className="mt-7 text-balance text-[44px] font-semibold leading-[1] tracking-[-0.035em] sm:text-[72px]">
            <span className="text-[hsl(210_40%_98%)]">One Secure Ecosystem.</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, hsl(220 100% 92%) 0%, hsl(220 95% 70%) 60%, hsl(222 89% 50%) 100%)",
              }}
            >
              Everywhere&nbsp;you&nbsp;work.
            </span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-[hsl(215_18%_72%)]">
            One encrypted intelligence powers every surface — from browser to CLI to enterprise.
            Move seamlessly. Stay sealed.
          </p>
        </div>

        {/* ---------------------------------- Stage ----------------------------------- */}
        <div
          ref={stageRef}
          className="relative mx-auto mt-24 aspect-square w-full max-w-[920px]"
          style={{ perspective: "1600px" }}
        >
          <div
            className="relative h-full w-full transition-transform duration-500 ease-out will-change-transform"
            style={{
              transform: `rotateX(${tilt.y * -7}deg) rotateY(${tilt.x * 9}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* faint horizon plane */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse 50% 38% at 50% 50%, hsl(222 89% 55% / 0.32), transparent 70%)",
                filter: "blur(20px)",
                transform: "translate(-50%, -50%) translateZ(-120px)",
              }}
            />

            <Orbits />
            <ConnectionField />
            <Core />

            {/* Modules */}
            {modules.map((m, i) => {
              const r = m.ring === 0 ? 24 : 44; // % of stage
              const rad = (m.angle * Math.PI) / 180;
              const x = 50 + Math.cos(rad) * r;
              const y = 50 + Math.sin(rad) * r * 0.78; // slight vertical compression -> spatial feel
              return (
                <ModuleCard
                  key={i}
                  m={m}
                  index={i}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Footer signal row */}
        <div className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] text-[hsl(215_18%_70%)]">
          <Pill dot>Live · end-to-end encrypted sync</Pill>
          <Pill>AES-256 · ChaCha20-Poly1305</Pill>
          <Pill>Zero-knowledge architecture</Pill>
          <Pill>SOC 2 · ISO 27001</Pill>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;

/* -------------------------------------------------------------------------- */
/*                                  Atmosphere                                */
/* -------------------------------------------------------------------------- */

const Atmosphere = ({ lightX, lightY }: { lightX: number; lightY: number }) => (
  <div className="pointer-events-none absolute inset-0">
    {/* base aurora */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 38%, hsl(222 89% 55% / 0.28), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, hsl(220 95% 65% / 0.10), transparent 70%), linear-gradient(180deg, hsl(224 50% 4%) 0%, hsl(224 55% 3%) 100%)",
      }}
    />
    {/* mouse-reactive bloom */}
    <div
      className="absolute inset-0 transition-all duration-700"
      style={{
        background: `radial-gradient(circle 600px at ${lightX}% ${lightY}%, hsl(220 100% 70% / 0.10), transparent 60%)`,
      }}
    />
    {/* faint grid with vignette mask */}
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "linear-gradient(to right, hsl(210 40% 98% / 1) 1px, transparent 1px), linear-gradient(to bottom, hsl(210 40% 98% / 1) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage:
          "radial-gradient(ellipse 60% 55% at 50% 45%, #000 30%, transparent 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 60% 55% at 50% 45%, #000 30%, transparent 80%)",
      }}
    />
    {/* fog layer */}
    <div
      className="absolute inset-x-0 bottom-0 h-1/2"
      style={{
        background:
          "linear-gradient(to top, hsl(222 89% 55% / 0.06), transparent)",
        filter: "blur(40px)",
      }}
    />
    {/* particles */}
    {Array.from({ length: 36 }).map((_, i) => {
      const size = 1 + (i % 3 === 0 ? 1.5 : 0);
      return (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${(i * 41) % 100}%`,
            top: `${(i * 67) % 100}%`,
            width: size,
            height: size,
            background:
              i % 4 === 0 ? "hsl(220 100% 92%)" : "hsl(220 95% 75%)",
            opacity: 0.2 + (i % 5) * 0.08,
            boxShadow: `0 0 ${4 + (i % 4) * 2}px hsl(220 95% 75% / 0.7)`,
            animation: `float ${7 + (i % 6)}s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      );
    })}
    {/* noise */}
    <div
      className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                    Orbits                                  */
/* -------------------------------------------------------------------------- */

const Orbits = () => (
  <>
    {[100, 74, 48].map((s, i) => (
      <div
        key={s}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: `${s}%`,
          height: `${s * 0.78}%`, // elliptical for spatial feel
          border: "1px solid hsl(220 60% 70% / 0.10)",
          boxShadow: "0 0 60px hsl(222 89% 55% / 0.05) inset",
          transform: `translate(-50%, -50%) translateZ(${-20 - i * 30}px)`,
        }}
      />
    ))}
  </>
);

/* -------------------------------------------------------------------------- */
/*                          Connection / data streams                         */
/* -------------------------------------------------------------------------- */

const ConnectionField = () => {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="-200 -200 400 400"
      fill="none"
    >
      <defs>
        <radialGradient id="streamGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(220 100% 90%)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(220 95% 75%)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(220 100% 95%)" stopOpacity="0" />
          <stop offset="50%" stopColor="hsl(220 100% 95%)" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(220 100% 95%)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {modules.map((m, i) => {
        const r = m.ring === 0 ? 100 : 184;
        const rad = (m.angle * Math.PI) / 180;
        const x = Math.cos(rad) * r;
        const y = Math.sin(rad) * r * 0.78;
        // curved path via quadratic with offset control point
        const cx = x * 0.5 + (-y) * 0.18;
        const cy = y * 0.5 + x * 0.18;
        const d = `M 0 0 Q ${cx} ${cy} ${x} ${y}`;
        const dur = 3.4 + (i % 5) * 0.6;
        return (
          <g key={i}>
            {/* base path */}
            <path
              d={d}
              stroke="url(#streamGrad)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* glow path */}
            <path
              d={d}
              stroke="hsl(220 100% 90%)"
              strokeWidth="0.6"
              strokeOpacity="0.35"
              strokeLinecap="round"
            />
            {/* travelling pulse */}
            <path
              d={d}
              stroke="hsl(220 100% 95%)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="6 600"
              style={{
                animation: `flow ${dur}s linear ${i * 0.35}s infinite`,
                filter: "drop-shadow(0 0 4px hsl(220 100% 90%))",
              }}
            />
          </g>
        );
      })}
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Encrypted Core                              */
/* -------------------------------------------------------------------------- */

const Core = () => (
  <div
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    style={{ transform: "translate(-50%, -50%) translateZ(120px)" }}
  >
    {/* outer volumetric halo */}
    <div
      className="absolute -inset-40 rounded-full"
      style={{
        background:
          "radial-gradient(circle, hsl(222 89% 55% / 0.55), transparent 60%)",
        filter: "blur(40px)",
        animation: "pulse-glow 5s ease-in-out infinite",
      }}
    />
    {/* spinning conic ring */}
    <div
      className="absolute -inset-10 rounded-full opacity-70"
      style={{
        background:
          "conic-gradient(from 0deg, transparent 0deg, hsl(220 100% 90% / 0.55) 60deg, transparent 120deg, transparent 240deg, hsl(220 95% 70% / 0.45) 300deg, transparent 360deg)",
        mask:
          "radial-gradient(circle, transparent 58%, #000 60%, #000 64%, transparent 66%)",
        WebkitMask:
          "radial-gradient(circle, transparent 58%, #000 60%, #000 64%, transparent 66%)",
        animation: "spin 14s linear infinite",
      }}
    />
    {/* counter-rotating thin ring */}
    <div
      className="absolute -inset-2 rounded-full opacity-80"
      style={{
        background:
          "conic-gradient(from 180deg, transparent, hsl(220 100% 95% / 0.6), transparent 30%)",
        mask:
          "radial-gradient(circle, transparent 70%, #000 72%, #000 73%, transparent 74%)",
        WebkitMask:
          "radial-gradient(circle, transparent 70%, #000 72%, #000 73%, transparent 74%)",
        animation: "spin 9s linear infinite reverse",
      }}
    />

    {/* glass orb */}
    <div
      className="relative flex h-52 w-52 items-center justify-center rounded-[2.25rem]"
      style={{
        background:
          "linear-gradient(160deg, hsl(220 95% 70% / 0.85) 0%, hsl(222 89% 45% / 0.95) 45%, hsl(224 76% 22% / 0.95) 100%)",
        boxShadow: [
          "inset 0 1.5px 0 hsl(220 100% 96% / 0.55)",
          "inset 0 -30px 60px hsl(224 80% 14% / 0.7)",
          "inset 0 0 60px hsl(220 100% 80% / 0.18)",
          "0 40px 120px -10px hsl(222 89% 55% / 0.65)",
          "0 0 0 1px hsl(220 95% 80% / 0.18)",
        ].join(", "),
        animation: "float 7s ease-in-out infinite",
      }}
    >
      {/* facet highlights */}
      <div
        className="absolute inset-3 rounded-[1.7rem]"
        style={{
          border: "1px solid hsl(220 100% 96% / 0.18)",
          background:
            "linear-gradient(140deg, hsl(220 100% 96% / 0.22) 0%, transparent 45%)",
        }}
      />
      {/* moving sheen */}
      <div className="absolute inset-0 overflow-hidden rounded-[2.25rem]">
        <div
          className="absolute -inset-y-2 w-1/2"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, hsl(220 100% 96% / 0.35) 50%, transparent 70%)",
            animation: "shimmerCore 6s ease-in-out infinite",
          }}
        />
      </div>
      {/* bottom inner glow */}
      <div
        className="absolute inset-x-6 bottom-3 h-10 rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(220 100% 80% / 0.45), transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* center content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className="rounded-2xl border border-[hsl(220_100%_92%/0.28)] bg-[hsl(224_60%_5%/0.45)] p-3.5 backdrop-blur-md"
          style={{
            boxShadow:
              "inset 0 1px 0 hsl(220 100% 96% / 0.25), 0 8px 24px hsl(224 60% 4% / 0.5)",
          }}
        >
          <Lock className="h-7 w-7 text-[hsl(220_100%_96%)]" strokeWidth={1.5} />
        </div>
        <div className="mt-3.5 text-[13px] font-semibold tracking-tight text-[hsl(220_100%_98%)]">
          Encrypted Core
        </div>
        <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.24em] text-[hsl(220_100%_90%/0.7)]">
          zero · knowledge
        </div>
        {/* live indicator */}
        <div className="mt-3 flex items-center gap-1.5 rounded-full border border-[hsl(220_100%_92%/0.18)] bg-[hsl(224_60%_5%/0.4)] px-2 py-0.5 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(152_85%_60%)] opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(152_85%_55%)]" />
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[hsl(220_100%_92%)]">
            Sealed
          </span>
        </div>
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                 Module card                                */
/* -------------------------------------------------------------------------- */

const ModuleCard = ({
  m,
  index,
  style,
}: {
  m: Module;
  index: number;
  style: React.CSSProperties;
}) => {
  const Icon = m.icon;
  // depth-based visual scaling: deeper cards (higher z) feel slightly larger and crisper
  const scale = 0.92 + (m.depth / 130) * 0.18;
  const opacity = 0.78 + (m.depth / 130) * 0.22;

  return (
    <div
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        ...style,
        animation: `float ${8 + (index % 4)}s ease-in-out ${index * 0.4}s infinite`,
        transform: `translate(-50%, -50%) translateZ(${m.depth}px) scale(${scale})`,
        opacity,
        width: 200,
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-500 ease-out group-hover:-translate-y-1.5"
        style={{
          background:
            "linear-gradient(160deg, hsl(224 45% 10% / 0.78), hsl(224 55% 6% / 0.82))",
          border: "1px solid hsl(220 60% 70% / 0.14)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          boxShadow: [
            "inset 0 1px 0 hsl(220 100% 96% / 0.06)",
            "0 24px 50px -22px hsl(224 60% 2% / 0.9)",
            "0 2px 8px hsl(224 60% 2% / 0.4)",
          ].join(", "),
        }}
      >
        {/* hover edge glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(160deg, hsl(220 100% 80% / 0.18), transparent 50%)",
            boxShadow:
              "inset 0 0 0 1px hsl(220 95% 75% / 0.45), 0 0 30px hsl(222 89% 55% / 0.3)",
          }}
        />
        {/* top sheen */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(220 100% 95% / 0.55), transparent)",
          }}
        />

        {/* Header */}
        <div className="flex items-start gap-3 px-3.5 pt-3.5">
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background:
                "linear-gradient(160deg, hsl(220 95% 65% / 0.45), hsl(224 76% 30% / 0.55))",
              border: "1px solid hsl(220 95% 80% / 0.28)",
              boxShadow:
                "inset 0 1px 0 hsl(220 100% 96% / 0.3), 0 0 18px hsl(222 89% 55% / 0.4)",
            }}
          >
            <Icon className="h-[18px] w-[18px] text-[hsl(220_100%_94%)]" strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-[13px] font-semibold tracking-tight text-[hsl(210_40%_98%)]">
                {m.label}
              </div>
              {m.status === "soon" && (
                <span className="rounded-full border border-[hsl(220_95%_75%/0.3)] bg-[hsl(222_89%_55%/0.15)] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-wider text-[hsl(220_100%_88%)]">
                  Soon
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-[10.5px] text-[hsl(215_18%_68%)]">
              {m.desc}
            </div>
          </div>
        </div>

        {/* Mini preview */}
        <div className="px-3.5 pb-3.5 pt-3">
          <MiniPreview kind={m.preview} />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Mini previews                               */
/* -------------------------------------------------------------------------- */

const previewBase: React.CSSProperties = {
  background:
    "linear-gradient(180deg, hsl(224 45% 7% / 0.7), hsl(224 55% 4% / 0.7))",
  border: "1px solid hsl(220 60% 70% / 0.10)",
  borderRadius: 10,
};

const MiniPreview = ({ kind }: { kind: Preview }) => {
  switch (kind) {
    case "browser":
      return (
        <div className="space-y-1.5 p-2" style={previewBase}>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(0_60%_55%)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(40_80%_55%)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(140_60%_50%)]" />
            <div className="ml-1 h-3 flex-1 rounded-sm bg-[hsl(224_30%_18%/0.7)] px-1.5 font-mono text-[8px] leading-3 text-[hsl(220_100%_88%)]">
              novasafe.app
            </div>
          </div>
          <div className="h-7 rounded-md bg-[hsl(222_89%_55%/0.15)]" />
        </div>
      );
    case "extension":
      return (
        <div className="space-y-1 p-2" style={previewBase}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[hsl(215_18%_70%)]">Autofill</span>
            <Check className="h-2.5 w-2.5 text-[hsl(152_85%_55%)]" />
          </div>
          <div className="rounded bg-[hsl(224_30%_15%/0.7)] px-1.5 py-1 font-mono text-[9px] text-[hsl(220_100%_92%)]">
            ••••••••••••
          </div>
          <div className="font-mono text-[8px] text-[hsl(215_18%_60%)]">github.com</div>
        </div>
      );
    case "mobile":
      return (
        <div className="flex items-center justify-between p-2" style={previewBase}>
          <Fingerprint className="h-6 w-6 text-[hsl(220_100%_85%)]" strokeWidth={1.4} />
          <div className="space-y-1 text-right">
            <div className="text-[9px] font-semibold text-[hsl(220_100%_92%)]">Face ID</div>
            <div className="font-mono text-[8px] text-[hsl(152_85%_60%)]">authorized</div>
          </div>
        </div>
      );
    case "desktop":
      return (
        <div className="space-y-1.5 p-2" style={previewBase}>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(220_30%_30%)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(220_30%_30%)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(220_30%_30%)]" />
          </div>
          <div className="flex h-7 items-center justify-center rounded bg-[hsl(224_30%_12%/0.6)] text-[8.5px] font-semibold uppercase tracking-wider text-[hsl(215_18%_60%)]">
            Coming soon
          </div>
        </div>
      );
    case "cli":
      return (
        <div className="p-2 font-mono text-[9px] leading-tight" style={previewBase}>
          <div className="text-[hsl(152_85%_60%)]">$ novasafe run --env prod</div>
          <div className="text-[hsl(215_18%_60%)]">↳ injected 12 secrets</div>
        </div>
      );
    case "api":
      return (
        <div className="p-2 font-mono text-[9px] leading-tight" style={previewBase}>
          <div className="text-[hsl(220_100%_85%)]">POST /v1/secrets</div>
          <div className="text-[hsl(152_85%_60%)]">200 · 38ms</div>
        </div>
      );
    case "admin":
      return (
        <div className="space-y-1 p-2" style={previewBase}>
          <div className="flex items-end gap-0.5">
            {[6, 10, 8, 14, 11, 16, 12].map((h, i) => (
              <span
                key={i}
                className="w-2 rounded-sm"
                style={{
                  height: h,
                  background: "linear-gradient(180deg, hsl(220 100% 75%), hsl(222 89% 50%))",
                }}
              />
            ))}
          </div>
          <div className="text-[8.5px] text-[hsl(215_18%_65%)]">142 active sessions</div>
        </div>
      );
    case "sync":
      return (
        <div className="flex items-center gap-2 p-2" style={previewBase}>
          <Wifi className="h-4 w-4 text-[hsl(220_100%_88%)]" strokeWidth={1.5} />
          <div className="flex-1">
            <div className="text-[9px] font-semibold text-[hsl(220_100%_92%)]">Synced</div>
            <div className="font-mono text-[8px] text-[hsl(152_85%_60%)]">just now · 4 devices</div>
          </div>
        </div>
      );
    case "passwords":
      return (
        <div className="space-y-1 p-2" style={previewBase}>
          {["github.com", "stripe.com", "figma.com"].map((d) => (
            <div key={d} className="flex items-center justify-between">
              <span className="text-[9px] text-[hsl(215_18%_75%)]">{d}</span>
              <span className="font-mono text-[9px] text-[hsl(220_100%_85%)]">••••••</span>
            </div>
          ))}
        </div>
      );
    case "documents":
      return (
        <div className="space-y-1 p-2" style={previewBase}>
          {["passport.pdf", "tax-2025.docx"].map((d) => (
            <div key={d} className="flex items-center justify-between">
              <span className="truncate text-[9px] text-[hsl(215_18%_75%)]">{d}</span>
              <Lock className="h-2.5 w-2.5 text-[hsl(220_100%_85%)]" strokeWidth={1.8} />
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                                 Pill helper                                */
/* -------------------------------------------------------------------------- */

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
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(152_85%_55%)] opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(152_85%_55%)]" />
      </span>
    )}
    {children}
  </span>
);

/* unused import guard (Activity reserved for future) */
void Activity;