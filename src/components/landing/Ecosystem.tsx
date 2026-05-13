import { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Puzzle,
  Smartphone,
  Monitor,
  Terminal,
  Code2,
  ShieldCheck,
  Cloud,
  Lock,
  Sparkles,
  Check,
  Wifi,
  Fingerprint,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                  Module data                               */
/* -------------------------------------------------------------------------- */

type Preview =
  | "browser"
  | "extension"
  | "mobile"
  | "desktop"
  | "cli"
  | "api"
  | "admin"
  | "sync";

type Module = {
  icon: typeof Globe;
  label: string;
  desc: string;
  status?: "live" | "soon";
  /** angle on the orbit (degrees, 0=right, 90=down) */
  angle: number;
  /** depth z-translation in px */
  depth: number;
  preview: Preview;
};

/** 8 ecosystem nodes evenly distributed around the encrypted core */
const modules: Module[] = [
  { icon: Globe,       label: "Web App",           desc: "Access anywhere",          angle: -90,  depth: 30,  preview: "browser"   },
  { icon: Puzzle,      label: "Browser Extension", desc: "Chrome · Edge · Firefox",  angle: -45,  depth: 60,  preview: "extension" },
  { icon: Smartphone,  label: "Mobile Apps",       desc: "iOS · Android · Face ID",  angle: 0,    depth: 90,  preview: "mobile"    },
  { icon: Cloud,       label: "Encrypted Sync",    desc: "End-to-end · real-time",   angle: 45,   depth: 60,  preview: "sync"      },
  { icon: Monitor,     label: "Desktop App",       desc: "macOS · Windows · Linux",  angle: 90,   depth: 30,  preview: "desktop", status: "soon" },
  { icon: Terminal,    label: "CLI",               desc: "Secure env injection",     angle: 135,  depth: 60,  preview: "cli"       },
  { icon: Code2,       label: "Secrets API",       desc: "REST · SDK · Webhooks",    angle: 180,  depth: 90,  preview: "api"       },
  { icon: ShieldCheck, label: "Admin Console",     desc: "SSO · audit · RBAC",       angle: 225,  depth: 60,  preview: "admin"     },
];

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export const Ecosystem = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 40 });

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
      setLight({ x: 50, y: 40 });
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
      className="relative flex min-h-[780px] flex-col overflow-hidden bg-[hsl(224_55%_4%)] text-[hsl(210_40%_98%)] lg:h-screen lg:max-h-[1040px]"
    >
      <Atmosphere lightX={light.x} lightY={light.y} />

      {/* atmospheric, multi-stop transitions in/out of the dark scene */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 22%, hsl(224 55% 6% / 0.55) 55%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44"
        style={{
          background:
            "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 25%, hsl(224 55% 6% / 0.45) 60%, transparent 100%)",
        }}
      />

      <div className="container relative z-20 flex flex-1 flex-col pt-14 pb-10 lg:pt-16 lg:pb-12">
        {/* ---------------------------------- Header ---------------------------------- */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(220_95%_75%/0.18)] bg-[hsl(222_89%_55%/0.10)] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[hsl(220_100%_88%)] backdrop-blur">
            <Sparkles className="h-3 w-3" /> The Ecosystem
          </span>
          <h2 className="mt-5 text-balance text-[34px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[44px] lg:text-[52px]">
            <span className="text-[hsl(210_40%_98%)]">The encrypted nervous system</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, hsl(220 100% 92%) 0%, hsl(220 95% 70%) 60%, hsl(222 89% 50%) 100%)",
              }}
            >
              of your digital life.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-[hsl(215_18%_72%)]">
            One zero-knowledge core. Every surface in sync. Every byte sealed end-to-end.
          </p>
        </div>

        {/* ---------------------------------- Stage ----------------------------------- */}
        <div className="relative mt-4 flex flex-1 items-center justify-center lg:mt-0">
          <div
            ref={stageRef}
            className="relative aspect-[16/9] w-full max-w-[1320px]"
            style={{ perspective: "1800px" }}
          >
            <div
              className="relative h-full w-full transition-transform duration-700 ease-out will-change-transform"
              style={{
                transform: `rotateX(${tilt.y * -5}deg) rotateY(${tilt.x * 7}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* horizon plane glow */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[110%] w-[110%] rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse 50% 36% at 50% 50%, hsl(222 89% 55% / 0.36), transparent 70%)",
                  filter: "blur(24px)",
                  transform: "translate(-50%, -50%) translateZ(-140px)",
                }}
              />

              <Orbits />
              <ConnectionField />
              <Core />

              {/* Modules */}
              {modules.map((m, i) => {
                // wider elliptical orbit — give every node room to breathe
                const rx = 47; // % of stage width from center
                const ry = 41; // % of stage height from center
                const rad = (m.angle * Math.PI) / 180;
                const x = 50 + Math.cos(rad) * rx;
                const y = 50 + Math.sin(rad) * ry;
                return (
                  <ModuleCard
                    key={i}
                    m={m}
                    index={i}
                    tiltX={tilt.x}
                    tiltY={tilt.y}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer signal row */}
        <div className="relative z-20 mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[11.5px] text-[hsl(215_18%_72%)]">
          <Pill dot>Live · end-to-end encrypted sync</Pill>
          <Pill>AES-256 · ChaCha20-Poly1305</Pill>
          <Pill>Zero-knowledge by design</Pill>
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

const Atmosphere = ({ lightX, lightY }: { lightX: number; lightY: number }) => {
  // memoized particle positions to avoid re-shuffling
  const particles = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        left: (i * 41) % 100,
        top: (i * 67) % 100,
        size: 1 + (i % 3 === 0 ? 1.5 : 0),
        delay: (i * 0.18) % 6,
        dur: 7 + (i % 6),
        bright: i % 4 === 0,
        opacity: 0.18 + (i % 5) * 0.08,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* base aurora */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, hsl(222 89% 55% / 0.30), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, hsl(220 95% 65% / 0.10), transparent 70%), linear-gradient(180deg, hsl(224 55% 4%) 0%, hsl(224 60% 3%) 100%)",
        }}
      />
      {/* mouse-reactive bloom */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(circle 720px at ${lightX}% ${lightY}%, hsl(220 100% 70% / 0.10), transparent 60%)`,
        }}
      />
      {/* faint grid with vignette mask */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(210 40% 98%) 1px, transparent 1px), linear-gradient(to bottom, hsl(210 40% 98%) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 48%, #000 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 48%, #000 30%, transparent 80%)",
        }}
      />
      {/* particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.bright ? "hsl(220 100% 92%)" : "hsl(220 95% 75%)",
            opacity: p.opacity,
            boxShadow: `0 0 ${4 + (i % 4) * 2}px hsl(220 95% 75% / 0.7)`,
            animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
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
};

/* -------------------------------------------------------------------------- */
/*                                    Orbits                                  */
/* -------------------------------------------------------------------------- */

const Orbits = () => (
  <>
    {[100, 72, 46].map((s, i) => (
      <div
        key={s}
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: `${s}%`,
          height: `${s * 0.86}%`,
          border: "1px dashed hsl(220 60% 70% / 0.10)",
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
      viewBox="-200 -125 400 250"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <radialGradient id="streamGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(220 100% 92%)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(220 95% 75%)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="packetGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(220 100% 98%)" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(220 100% 80%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {modules.map((m, i) => {
        // match wider orbit radii (rx 47%, ry 41% of stage; stage viewBox is 400x250)
        const rx = 188;
        const ry = 102;
        const rad = (m.angle * Math.PI) / 180;
        const x = Math.cos(rad) * rx;
        const y = Math.sin(rad) * ry;
        // curved path via quadratic with perpendicular offset
        const cx = x * 0.5 + -y * 0.18;
        const cy = y * 0.5 + x * 0.18;
        const d = `M 0 0 Q ${cx} ${cy} ${x} ${y}`;
        const dur = 3.6 + (i % 5) * 0.55;
        return (
          <g key={i}>
            {/* base path */}
            <path d={d} stroke="url(#streamGrad)" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
            {/* outbound traveling pulse (core → node) */}
            <path
              d={d}
              stroke="hsl(220 100% 96%)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeDasharray="4 600"
              style={{
                animation: `flow ${dur}s linear ${i * 0.32}s infinite`,
                filter: "drop-shadow(0 0 5px hsl(220 100% 90%))",
              }}
            />
            {/* secondary slower glint */}
            <path
              d={d}
              stroke="hsl(220 95% 80%)"
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeDasharray="2 600"
              style={{
                animation: `flow ${dur * 1.7}s linear ${i * 0.22 + 1.5}s infinite`,
                opacity: 0.7,
              }}
            />
            {/* encrypted packet — small bright dot traveling along path */}
            <circle r="1.6" fill="url(#packetGrad)" style={{ filter: "drop-shadow(0 0 4px hsl(220 100% 92%))" }}>
              <animateMotion dur={`${dur * 1.4}s`} begin={`${i * 0.45}s`} repeatCount="indefinite" path={d} rotate="auto" />
              <animate attributeName="opacity" values="0;1;1;0" dur={`${dur * 1.4}s`} begin={`${i * 0.45}s`} repeatCount="indefinite" />
            </circle>
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
    className="absolute left-1/2 top-1/2"
    style={{ transform: "translate(-50%, -50%) translateZ(140px)" }}
  >
    {/* outer volumetric halo */}
    <div
      className="absolute -inset-44 rounded-full"
      style={{
        background:
          "radial-gradient(circle, hsl(222 89% 55% / 0.55), transparent 60%)",
        filter: "blur(50px)",
        animation: "pulse-glow 5s ease-in-out infinite",
      }}
    />
    {/* spinning conic ring (large) */}
    <div
      className="absolute -inset-12 rounded-full opacity-70"
      style={{
        background:
          "conic-gradient(from 0deg, transparent 0deg, hsl(220 100% 90% / 0.55) 60deg, transparent 120deg, transparent 240deg, hsl(220 95% 70% / 0.45) 300deg, transparent 360deg)",
        mask: "radial-gradient(circle, transparent 58%, #000 60%, #000 64%, transparent 66%)",
        WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%, #000 64%, transparent 66%)",
        animation: "spin 14s linear infinite",
      }}
    />
    {/* counter-rotating thin ring */}
    <div
      className="absolute -inset-2 rounded-full opacity-80"
      style={{
        background:
          "conic-gradient(from 180deg, transparent, hsl(220 100% 95% / 0.6), transparent 30%)",
        mask: "radial-gradient(circle, transparent 70%, #000 72%, #000 73%, transparent 74%)",
        WebkitMask: "radial-gradient(circle, transparent 70%, #000 72%, #000 73%, transparent 74%)",
        animation: "spin 9s linear infinite reverse",
      }}
    />

    {/* glass orb */}
    <div
      className="relative flex h-44 w-44 items-center justify-center rounded-[2rem] sm:h-52 sm:w-52 sm:rounded-[2.25rem]"
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
        className="absolute inset-3 rounded-[1.6rem] sm:rounded-[1.75rem]"
        style={{
          border: "1px solid hsl(220 100% 96% / 0.18)",
          background:
            "linear-gradient(140deg, hsl(220 100% 96% / 0.22) 0%, transparent 45%)",
        }}
      />
      {/* moving sheen */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] sm:rounded-[2.25rem]">
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
          className="rounded-2xl border border-[hsl(220_100%_92%/0.28)] bg-[hsl(224_60%_5%/0.45)] p-3 backdrop-blur-md"
          style={{
            boxShadow:
              "inset 0 1px 0 hsl(220 100% 96% / 0.25), 0 8px 24px hsl(224 60% 4% / 0.5)",
          }}
        >
          <Lock className="h-6 w-6 text-[hsl(220_100%_96%)] sm:h-7 sm:w-7" strokeWidth={1.5} />
        </div>
        <div className="mt-3 text-[12.5px] font-semibold tracking-tight text-[hsl(220_100%_98%)] sm:text-[13px]">
          Encrypted Core
        </div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[hsl(220_100%_90%/0.7)]">
          zero · knowledge
        </div>
        {/* live indicator */}
        <div className="mt-2.5 flex items-center gap-1.5 rounded-full border border-[hsl(220_100%_92%/0.18)] bg-[hsl(224_60%_5%/0.4)] px-2 py-0.5 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(152_85%_60%)] opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(152_85%_55%)]" />
          </span>
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[hsl(220_100%_92%)]">
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
  tiltX = 0,
  tiltY = 0,
}: {
  m: Module;
  index: number;
  style: React.CSSProperties;
  tiltX?: number;
  tiltY?: number;
}) => {
  const Icon = m.icon;
  const scale = 0.94 + (m.depth / 90) * 0.10;
  const opacity = 0.86 + (m.depth / 90) * 0.14;
  // depth-based parallax — closer cards (higher depth) move more
  const par = 6 + (m.depth / 90) * 10;
  const px = -tiltX * par;
  const py = -tiltY * par;

  return (
    <div
      className="group absolute"
      style={{
        ...style,
        transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) translateZ(${m.depth}px) scale(${scale})`,
        opacity,
        width: 208,
        transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="relative animate-float overflow-hidden rounded-2xl transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.025]"
        style={{
          animationDuration: `${8 + (index % 4)}s`,
          animationDelay: `${index * 0.4}s`,
          background:
            "linear-gradient(160deg, hsl(224 42% 13% / 0.86), hsl(224 55% 7% / 0.9))",
          border: "1px solid hsl(220 60% 75% / 0.20)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          boxShadow: [
            "inset 0 1px 0 hsl(220 100% 96% / 0.09)",
            "0 32px 64px -22px hsl(224 60% 2% / 0.95)",
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
              <div className="truncate text-[13.5px] font-semibold tracking-tight text-[hsl(210_40%_99%)]">
                {m.label}
              </div>
              {m.status === "soon" && (
                <span className="rounded-full border border-[hsl(220_95%_75%/0.3)] bg-[hsl(222_89%_55%/0.15)] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-wider text-[hsl(220_100%_88%)]">
                  Soon
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-[10.5px] text-[hsl(218_22%_82%)]">
              {m.desc}
            </div>
          </div>
        </div>

        {/* Mini preview */}
        <div className="px-3.5 pb-3.5 pt-2.5">
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
            <div className="ml-1 flex h-3 flex-1 items-center rounded-sm bg-[hsl(224_30%_18%/0.7)] px-1.5 font-mono text-[8px] leading-3 text-[hsl(220_100%_88%)]">
              novasafe.app/vault
            </div>
          </div>
          <div className="h-7 rounded-md bg-[hsl(222_89%_55%/0.15)]" />
        </div>
      );
    case "extension":
      return (
        <div className="space-y-1.5 p-2" style={previewBase}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[9px] text-[hsl(218_22%_82%)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(152_85%_55%)] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(152_85%_55%)]" />
              </span>
              Autofill · github.com
            </span>
            <Check className="h-2.5 w-2.5 text-[hsl(152_85%_60%)]" />
          </div>
          <div className="space-y-0.5 rounded bg-[hsl(224_30%_14%/0.8)] px-1.5 py-1">
            <div className="font-mono text-[8px] text-[hsl(218_22%_72%)]">user@novasafe.app</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-[hsl(220_100%_94%)]">••••••••••••</div>
          </div>
          <div className="font-mono text-[8px] text-[hsl(218_22%_72%)]">passkey · ready</div>
        </div>
      );
    case "mobile":
      return (
        <div className="flex items-center justify-between p-2" style={previewBase}>
          <div className="relative">
            <span className="absolute inset-0 -m-1 rounded-full bg-[hsl(152_85%_55%/0.18)] blur-sm" />
            <Fingerprint className="relative h-6 w-6 text-[hsl(152_85%_70%)]" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5 text-right">
            <div className="text-[9.5px] font-semibold text-[hsl(220_100%_96%)]">Face ID</div>
            <div className="flex items-center justify-end gap-1 font-mono text-[8.5px] text-[hsl(152_85%_65%)]">
              <span className="h-1 w-1 rounded-full bg-[hsl(152_85%_60%)]" />
              authorized · 2s
            </div>
          </div>
        </div>
      );
    case "desktop":
      return (
        <div className="space-y-1.5 p-2" style={previewBase}>
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] text-[hsl(218_22%_84%)]">Local vault</span>
            <span className="flex items-center gap-1 font-mono text-[8.5px] text-[hsl(152_85%_65%)]">
              <span className="h-1 w-1 rounded-full bg-[hsl(152_85%_60%)]" /> offline ready
            </span>
          </div>
          <div className="flex h-5 items-center justify-between rounded bg-[hsl(224_30%_12%/0.7)] px-1.5">
            <span className="font-mono text-[9px] text-[hsl(220_100%_92%)]">42 items · sealed</span>
            <Lock className="h-2.5 w-2.5 text-[hsl(220_100%_88%)]" strokeWidth={1.8} />
          </div>
        </div>
      );
    case "cli":
      return (
        <div className="space-y-0.5 p-2 font-mono text-[9.5px] leading-tight" style={previewBase}>
          <div>
            <span className="text-[hsl(152_85%_65%)]">$</span>{" "}
            <span className="text-[hsl(220_100%_94%)]">novasafe</span>{" "}
            <span className="text-[hsl(220_100%_85%)]">run</span>{" "}
            <span className="text-[hsl(40_90%_70%)]">--env prod</span>
          </div>
          <div className="text-[hsl(218_22%_78%)]">↳ injected 12 secrets · 0 on disk</div>
        </div>
      );
    case "api":
      return (
        <div className="space-y-0.5 p-2 font-mono text-[9.5px] leading-tight" style={previewBase}>
          <div>
            <span className="text-[hsl(40_90%_70%)]">POST</span>{" "}
            <span className="text-[hsl(220_100%_92%)]">/v1/secrets/inject</span>
          </div>
          <div className="text-[hsl(152_85%_65%)]">200 · 38ms · ci/cd</div>
        </div>
      );
    case "admin":
      return (
        <div className="space-y-1 p-2" style={previewBase}>
          <div className="flex items-end gap-[3px]">
            {[6, 10, 8, 14, 11, 16, 12, 9].map((h, i) => (
              <span
                key={i}
                className="w-1.5 rounded-[2px]"
                style={{
                  height: h,
                  background:
                    "linear-gradient(180deg, hsl(220 100% 82%), hsl(222 89% 55%))",
                  boxShadow: "0 0 6px hsl(222 89% 55% / 0.45)",
                }}
              />
            ))}
            <span className="ml-auto font-mono text-[9px] text-[hsl(152_85%_65%)]">142 ↑</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-[hsl(218_22%_82%)]">
            <ShieldCheck className="h-2.5 w-2.5 text-[hsl(220_100%_88%)]" strokeWidth={1.8} /> SSO · RBAC · audit
          </div>
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