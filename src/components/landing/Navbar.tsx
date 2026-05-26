import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ChevronDown, ArrowRight } from "lucide-react";
import { LANDING_ROUTES, buildLoginUrl } from "@/config";

const links = [
  { label: "Product", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Platforms", href: "#platforms" },
  { label: "Developers", href: "#developers" },
  { label: "Pricing", href: LANDING_ROUTES.pricing },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between gap-6 rounded-2xl px-4 py-2.5 transition-all duration-500",
          scrolled
            ? "glass-strong shadow-card border border-border/70"
            : "border border-transparent bg-transparent",
        )}
      >
        <a href="#" className="flex items-center">
          <Logo />
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:bg-secondary hover:text-ink">
              Company <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <a
            href={buildLoginUrl({ ref: "navbar" })}
            className="hidden rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink sm:block"
          >
            Sign in
          </a>
          <Link
            to={LANDING_ROUTES.pricing}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-background shadow-sm transition-all hover:bg-ink/90 hover:shadow-md"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
};