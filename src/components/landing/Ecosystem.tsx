import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreditCard,
  FileText,
  Fingerprint,
  Globe,
  KeyRound,
  Lock,
  Monitor,
  Puzzle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                  Module data                               */
/* -------------------------------------------------------------------------- */

type EcosystemNode = {
  icon: typeof Globe;
  label: string;
  platforms: string;
  description: string;
  angle: number;
  depth: number;
};

/** 10 user-facing ecosystem nodes — no internal infra / dev tooling */
const nodes: EcosystemNode[] = [
  {
    icon: Puzzle,
    label: "Browser Extension",
    platforms: "Chrome · Edge · Firefox · Brave",
    description: "Autofill passwords and passkeys instantly.",
    angle: -90,
    depth: 70,
  },
  {
    icon: Globe,
    label: "Web Vault",
    platforms: "Access anywhere",
    description: "Secure access from any modern browser.",
    angle: -54,
    depth: 55,
  },
  {
    icon: Smartphone,
    label: "Mobile Apps",
    platforms: "iPhone · Android",
    description: "Unlock with Face ID and biometrics.",
    angle: -18,
    depth: 85,
  },
  {
    icon: Monitor,
    label: "Desktop Apps",
    platforms: "Windows · macOS · Linux",
    description: "Offline access and secure local storage.",
    angle: 18,
    depth: 55,
  },
  {
    icon: KeyRound,
    label: "Passwords",
    platforms: "Password manager",
    description: "Store and autofill passwords across devices.",
    angle: 54,
    depth: 40,
  },
  {
    icon: Fingerprint,
    label: "Passkeys",
    platforms: "Passkey manager",
    description: "Create and manage passwordless logins.",
    angle: 90,
    depth: 70,
  },
  {
    icon: ShieldCheck,
    label: "Authenticator",
    platforms: "2FA codes",
    description: "Generate secure verification codes.",
    angle: 126,
    depth: 55,
  },
  {
    icon: FileText,
    label: "Secure Notes",
    platforms: "Encrypted notes",
    description: "Protect documents and sensitive information.",
    angle: 162,
    depth: 40,
  },
  {
    icon: CreditCard,
    label: "Cards",
    platforms: "Payment storage",
    description: "Store payment information securely.",
    angle: 198,
    depth: 70,
  },
  {
    icon: Terminal,
    label: "SSH Keys",
    platforms: "Infrastructure",
    description: "Protect infrastructure credentials.",
    angle: 234,
    depth: 55,
  },
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
        setTilt({
          x: (e.clientX - r.left) / r.width - 0.5,
          y: (e.clientY - r.top) / r.height - 0.5,
        });
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
      className="relative flex min-h-[900px] flex-col overflow-hidden bg-[hsl(224_55%_4%)] text-[hsl(210_40%_98%)] lg:min-h-[1000px]"
      aria-labelledby="ecosystem-heading"
    >
      <Atmosphere lightX={light.x} lightY={light.y} />

      <div
        className="pointer-events-none absolute inset-x-0 -top-px z-10 h-[280px]"
        style={{
          background: [
            "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.92) 18%, hsl(220 40% 16% / 0.55) 48%, hsl(224 55% 6% / 0.22) 78%, transparent 100%)",
            "radial-gradient(ellipse 80% 70% at 50% 0%, hsl(222 89% 55% / 0.18), transparent 70%)",
          ].join(", "),
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-px z-10 h-[260px]"
        style={{
          background: [
            "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.92) 20%, hsl(220 40% 16% / 0.5) 50%, hsl(224 55% 6% / 0.2) 80%, transparent 100%)",
            "radial-gradient(ellipse 80% 70% at 50% 100%, hsl(222 89% 55% / 0.14), transparent 70%)",
          ].join(", "),
        }}
      />

      <div className="container relative z-20 flex flex-1 flex-col pt-24 pb-20 lg:pt-28 lg:pb-24">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(220_95%_75%/0.18)] bg-[hsl(222_89%_55%/0.10)] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[hsl(220_100%_88%)] backdrop-blur">
            <Sparkles className="h-3 w-3" aria-hidden />
            Your digital identity hub
          </span>
          <h2
            id="ecosystem-heading"
            className="mt-5 text-balance text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] sm:text-[44px] lg:text-[52px]"
          >
            <span className="text-[hsl(210_40%_98%)]">One encrypted vault.</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, hsl(220 100% 92%) 0%, hsl(220 95% 70%) 60%, hsl(222 89% 50%) 100%)",
              }}
            >
              Every credential. Every device.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[hsl(215_18%_72%)] sm:text-base">
            Passwords, passkeys, authenticator codes, cards, secure notes, SSH keys and recovery codes —
            securely available wherever you work. One password manager and encrypted vault that keeps your
            entire digital identity in sync across browser extension, web vault, mobile app, and desktop app.
          </p>
        </header>

        {/* Desktop / tablet — orbital stage */}
        <div className="relative mt-8 hidden flex-1 items-center justify-center md:mt-4 md:flex">
          <div
            ref={stageRef}
            className="relative aspect-[16/9] w-full max-w-[1280px] min-h-[520px]"
            style={{ perspective: "1800px" }}
          >
            <div
              className="relative h-full w-full transition-transform duration-700 ease-out will-change-transform"
              style={{
                transform: `rotateX(${tilt.y * -4}deg) rotateY(${tilt.x * 6}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse 50% 40% at 50% 50%, hsl(222 89% 55% / 0.4), transparent 72%)",
                  filter: "blur(28px)",
                  transform: "translate(-50%, -50%) translateZ(-140px)",
                }}
              />

              <Orbits />
              <ConnectionField />
              <VaultCore />

              {nodes.map((node, i) => {
                const rx = 46;
                const ry = 40;
                const rad = (node.angle * Math.PI) / 180;
                const x = 50 + Math.cos(rad) * rx;
                const y = 50 + Math.sin(rad) * ry;
                return (
                  <EcosystemCard
                    key={node.label}
                    node={node}
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

        {/* Mobile — stacked grid */}
        <div className="relative z-20 mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
          <div className="col-span-full mb-4 flex justify-center">
            <MobileVaultCore />
          </div>
          {nodes.map((node, i) => (
            <MobileEcosystemCard key={node.label} node={node} index={i} />
          ))}
        </div>

        <footer className="relative z-20 mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11.5px] text-[hsl(215_18%_72%)]">
          <Pill dot>One vault · every device</Pill>
          <Pill>Password manager &amp; passkey manager</Pill>
          <Pill>Authenticator · secure notes · cards</Pill>
        </footer>
      </div>
    </section>
  );
};

export default Ecosystem;

/* -------------------------------------------------------------------------- */
/*                                  Atmosphere                                */
/* -------------------------------------------------------------------------- */

const Atmosphere = ({ lightX, lightY }: { lightX: number; lightY: number }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        left: (i * 41) % 100,
        top: (i * 67) % 100,
        size: 1 + (i % 3 === 0 ? 1.5 : 0),
        delay: (i * 0.18) % 6,
        dur: 7 + (i % 6),
        bright: i % 4 === 0,
        opacity: 0.16 + (i % 5) * 0.07,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 45%, hsl(222 89% 55% / 0.32), transparent 70%), radial-gradient(ellipse 120% 80% at 50% 50%, hsl(220 80% 40% / 0.10), transparent 80%), linear-gradient(180deg, hsl(224 50% 6%) 0%, hsl(224 58% 4%) 50%, hsl(224 50% 6%) 100%)",
        }}
      />
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(circle 720px at ${lightX}% ${lightY}%, hsl(220 100% 70% / 0.10), transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(210 40% 98%) 1px, transparent 1px), linear-gradient(to bottom, hsl(210 40% 98%) 1px, transparent 1px)",
          backgroundSize: "78px 78px",
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 50%, #000 18%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 50%, #000 18%, transparent 90%)",
        }}
      />
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
            boxShadow: `0 0 ${4 + (i % 4) * 2}px hsl(220 95% 75% / 0.6)`,
            animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

const Orbits = () => (
  <>
    {[100, 72, 48].map((s, i) => (
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

const ConnectionField = () => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="-200 -125 400 250"
    preserveAspectRatio="none"
    fill="none"
    aria-hidden
  >
    <defs>
      <radialGradient id="ecoStream" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(220 100% 92%)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="hsl(220 95% 75%)" stopOpacity="0" />
      </radialGradient>
    </defs>
    {nodes.map((node, i) => {
      const rx = 184;
      const ry = 100;
      const rad = (node.angle * Math.PI) / 180;
      const x = Math.cos(rad) * rx;
      const y = Math.sin(rad) * ry;
      const cx = x * 0.5 + -y * 0.15;
      const cy = y * 0.5 + x * 0.15;
      const d = `M 0 0 Q ${cx} ${cy} ${x} ${y}`;
      const dur = 4 + (i % 5) * 0.5;
      return (
        <g key={node.label}>
          <path d={d} stroke="url(#ecoStream)" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
          <path
            d={d}
            stroke="hsl(220 100% 96%)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeDasharray="3 500"
            style={{
              animation: `flow ${dur}s linear ${i * 0.28}s infinite`,
              filter: "drop-shadow(0 0 4px hsl(220 100% 90%))",
            }}
          />
        </g>
      );
    })}
  </svg>
);

const VaultCore = () => (
  <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%) translateZ(140px)" }}>
    <div
      className="absolute -inset-40 rounded-full"
      style={{
        background: "radial-gradient(circle, hsl(222 89% 55% / 0.5), transparent 62%)",
        filter: "blur(48px)",
        animation: "pulse-glow 5s ease-in-out infinite",
      }}
    />
    <div
      className="absolute -inset-10 rounded-full opacity-60"
      style={{
        background:
          "conic-gradient(from 0deg, transparent 0deg, hsl(220 100% 90% / 0.5) 60deg, transparent 120deg, transparent 240deg, hsl(220 95% 70% / 0.4) 300deg, transparent 360deg)",
        mask: "radial-gradient(circle, transparent 58%, #000 60%, #000 64%, transparent 66%)",
        WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%, #000 64%, transparent 66%)",
        animation: "spin 16s linear infinite",
      }}
    />

    <div
      className="relative flex h-48 w-48 flex-col items-center justify-center rounded-[2rem] px-4 text-center sm:h-52 sm:w-52"
      style={{
        background:
          "linear-gradient(160deg, hsl(220 95% 70% / 0.2) 0%, hsl(222 89% 45% / 0.35) 45%, hsl(224 76% 22% / 0.55) 100%)",
        backdropFilter: "blur(20px) saturate(150%)",
        WebkitBackdropFilter: "blur(20px) saturate(150%)",
        border: "1px solid hsl(220 95% 80% / 0.22)",
        boxShadow: [
          "inset 0 1px 0 hsl(220 100% 96% / 0.35)",
          "0 40px 100px -12px hsl(222 89% 55% / 0.55)",
        ].join(", "),
        animation: "float 7s ease-in-out infinite",
      }}
    >
      <div
        className="rounded-2xl border border-[hsl(220_100%_92%/0.25)] bg-[hsl(224_60%_5%/0.35)] p-3 backdrop-blur-md"
        style={{ boxShadow: "inset 0 1px 0 hsl(220 100% 96% / 0.2)" }}
      >
        <Lock className="h-7 w-7 text-[hsl(220_100%_96%)]" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-[15px] font-semibold tracking-tight text-[hsl(220_100%_98%)]">NovaSafe Vault</p>
      <p className="mt-1 max-w-[180px] text-[11px] leading-snug text-[hsl(220_100%_90%/0.75)]">
        Single encrypted source of truth
      </p>
      <div className="mt-3 flex items-center gap-1.5 rounded-full border border-[hsl(220_100%_92%/0.2)] bg-[hsl(224_60%_5%/0.35)] px-2.5 py-1 backdrop-blur">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(152_85%_60%)] opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(152_85%_55%)]" />
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[hsl(220_100%_92%)]">
          Protected
        </span>
      </div>
    </div>
  </div>
);

const MobileVaultCore = () => (
  <div
    className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-[hsl(220_60%_75%/0.2)] px-6 py-8 text-center"
    style={{
      background: "linear-gradient(160deg, hsl(224 42% 13% / 0.9), hsl(224 55% 7% / 0.95))",
      boxShadow: "0 24px 48px -16px hsl(222 89% 55% / 0.35)",
    }}
  >
    <div className="rounded-xl border border-[hsl(220_100%_92%/0.2)] bg-[hsl(222_89%_55%/0.15)] p-3">
      <Lock className="h-6 w-6 text-[hsl(220_100%_96%)]" />
    </div>
    <p className="mt-4 text-lg font-semibold text-[hsl(210_40%_98%)]">NovaSafe Vault</p>
    <p className="mt-1 text-sm text-[hsl(215_18%_72%)]">Single encrypted source of truth</p>
    <span className="mt-3 rounded-full border border-[hsl(152_85%_55%/0.3)] bg-[hsl(152_85%_55%/0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(152_85%_65%)]">
      Protected
    </span>
  </div>
);

const EcosystemCard = ({
  node,
  index,
  style,
  tiltX = 0,
  tiltY = 0,
}: {
  node: EcosystemNode;
  index: number;
  style: React.CSSProperties;
  tiltX?: number;
  tiltY?: number;
}) => {
  const Icon = node.icon;
  const scale = 0.92 + (node.depth / 85) * 0.08;
  const opacity = 0.88 + (node.depth / 85) * 0.12;
  const par = 5 + (node.depth / 85) * 8;

  return (
    <div
      className="group absolute w-[200px] lg:w-[212px]"
      style={{
        ...style,
        transform: `translate(calc(-50% + ${-tiltX * par}px), calc(-50% + ${-tiltY * par}px)) translateZ(${node.depth}px) scale(${scale})`,
        opacity,
        transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="relative animate-float overflow-hidden rounded-2xl p-4 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
        style={{
          animationDuration: `${8 + (index % 4)}s`,
          animationDelay: `${index * 0.35}s`,
          background: "linear-gradient(160deg, hsl(224 42% 13% / 0.88), hsl(224 55% 7% / 0.92))",
          border: "1px solid hsl(220 60% 75% / 0.18)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "inset 0 1px 0 hsl(220 100% 96% / 0.08), 0 24px 48px -20px hsl(224 60% 2% / 0.9)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            boxShadow: "inset 0 0 0 1px hsl(220 95% 75% / 0.35), 0 0 24px hsl(222 89% 55% / 0.25)",
          }}
        />
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(160deg, hsl(220 95% 65% / 0.4), hsl(224 76% 30% / 0.5))",
              border: "1px solid hsl(220 95% 80% / 0.25)",
            }}
          >
            <Icon className="h-[18px] w-[18px] text-[hsl(220_100%_94%)]" strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold tracking-tight text-[hsl(210_40%_99%)]">{node.label}</h3>
            <p className="mt-0.5 text-[10px] text-[hsl(218_22%_78%)]">{node.platforms}</p>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-[hsl(215_18%_72%)]">{node.description}</p>
      </div>
    </div>
  );
};

const MobileEcosystemCard = ({ node, index }: { node: EcosystemNode; index: number }) => {
  const Icon = node.icon;
  return (
    <article
      className="rounded-xl border border-[hsl(220_60%_75%/0.15)] p-4"
      style={{
        background: "linear-gradient(160deg, hsl(224 42% 13% / 0.9), hsl(224 55% 7% / 0.95))",
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(222_89%_55%/0.2)] text-[hsl(220_100%_94%)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[hsl(210_40%_98%)]">{node.label}</h3>
          <p className="text-[11px] text-[hsl(218_22%_78%)]">{node.platforms}</p>
          <p className="mt-2 text-xs leading-relaxed text-[hsl(215_18%_72%)]">{node.description}</p>
        </div>
      </div>
    </article>
  );
};

const Pill = ({ children, dot }: { children: React.ReactNode; dot?: boolean }) => (
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
