import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
    {children}
  </div>
);

export const PageHero = ({
  eyebrow, title, lede, children, align = "center",
}: { eyebrow?: string; title: ReactNode; lede?: ReactNode; children?: ReactNode; align?: "center" | "left" }) => (
  <section className="relative overflow-hidden pb-16 pt-16 sm:pb-24 sm:pt-24">
    <div className="absolute inset-0 -z-10 bg-mesh opacity-70" />
    <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade" />
    <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/12 via-primary-glow/6 to-transparent blur-3xl" />
    <div className={cn("container relative", align === "center" ? "text-center" : "")}>
      <div className={cn(align === "center" && "mx-auto max-w-3xl")}>
        {eyebrow && <div className="animate-fade-up"><Eyebrow>{eyebrow}</Eyebrow></div>}
        <h1
          className="animate-fade-up mt-5 text-balance text-[40px] font-semibold leading-[1.04] tracking-tightest text-ink sm:text-5xl md:text-[64px]"
          style={{ animationDelay: "0.05s" }}
        >
          {title}
        </h1>
        {lede && (
          <p
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-[17px] leading-relaxed text-ink-soft sm:text-lg"
            style={{ animationDelay: "0.15s" }}
          >
            {lede}
          </p>
        )}
        {children && (
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.25s" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  </section>
);

export const Section = ({
  children, className, container = true, id,
}: { children: ReactNode; className?: string; container?: boolean; id?: string }) => (
  <section id={id} className={cn("py-20 sm:py-28", className)}>
    {container ? <div className="container">{children}</div> : children}
  </section>
);

export const SectionHead = ({
  eyebrow, title, lede, align = "center",
}: { eyebrow?: string; title: ReactNode; lede?: ReactNode; align?: "center" | "left" }) => (
  <div className={cn("mb-14", align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl")}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 className="mt-4 text-balance text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-[44px]">
      {title}
    </h2>
    {lede && <p className="mt-4 text-balance text-[16px] leading-relaxed text-ink-soft sm:text-lg">{lede}</p>}
  </div>
);

export const PrimaryButton = ({ to, href, children, className }: { to?: string; href?: string; children: ReactNode; className?: string }) => {
  const cls = cn(
    "group inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14px] font-semibold text-background shadow-md transition-all hover:bg-ink/90 hover:shadow-lg",
    className
  );
  const inner = <>{children}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>;
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <a href={href || "#"} className={cls}>{inner}</a>;
};

export const GhostButton = ({ to, href, children, className }: { to?: string; href?: string; children: ReactNode; className?: string }) => {
  const cls = cn("inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3 text-[14px] font-semibold text-ink backdrop-blur transition-all hover:bg-secondary", className);
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <a href={href || "#"} className={cls}>{children}</a>;
};

export const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur transition-all hover:border-primary/30 hover:shadow-card">
    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-5 text-[16px] font-semibold text-ink">{title}</h3>
    <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{desc}</p>
  </div>
);

export const CheckList = ({ items }: { items: string[] }) => (
  <ul className="space-y-3">
    {items.map((i) => (
      <li key={i} className="flex items-start gap-3 text-[14.5px] text-ink-soft">
        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-3 w-3" />
        </span>
        {i}
      </li>
    ))}
  </ul>
);

export const CTASection = ({
  title = "Start using NovaSafe today",
  lede = "It takes 60 seconds. Your data never leaves your device unencrypted.",
  primary = { label: "Get started free", to: "/pricing" },
  secondary = { label: "Talk to sales", to: "/contact" },
}: {
  title?: string; lede?: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}) => (
  <section className="relative overflow-hidden py-24">
    <div className="container">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-surface-1 via-card to-surface-2 px-8 py-16 text-center shadow-card sm:px-16">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-50" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-[32px] font-semibold tracking-tight text-ink sm:text-4xl md:text-[44px]">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-[16px] text-ink-soft">{lede}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton to={primary.to}>{primary.label}</PrimaryButton>
            <GhostButton to={secondary.to}>{secondary.label}</GhostButton>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export const FAQ = ({ items }: { items: { q: string; a: string }[] }) => (
  <div className="mx-auto max-w-3xl divide-y divide-border/70 rounded-2xl border border-border/70 bg-card/60 backdrop-blur">
    {items.map((it, i) => (
      <details key={i} className="group p-6">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15.5px] font-semibold text-ink">
          {it.q}
          <span className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-secondary text-ink-soft transition-transform group-open:rotate-45">+</span>
        </summary>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{it.a}</p>
      </details>
    ))}
  </div>
);
