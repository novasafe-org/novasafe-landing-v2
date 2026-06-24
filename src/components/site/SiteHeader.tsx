import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/landing/Logo";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import { LANDING_ROUTES, buildLoginUrl } from "@/config";
import { inkCtaButtonClass, InkCtaArrow } from "@/components/site/primitives";

type ProductItem = {
  label: string;
  href: string;
  desc: string;
  badge?: string;
};

const PRODUCT_ITEMS: ProductItem[] = [
  {
    label: "Password Manager",
    href: "/features/password-manager",
    desc: "Secure password storage with zero-knowledge encryption.",
  },
  {
    label: "Security",
    href: LANDING_ROUTES.security,
    desc: "Learn how NovaSafe protects your data.",
  },
  {
    label: "Roadmap",
    href: `${LANDING_ROUTES.pricing}#roadmap`,
    desc: "See upcoming features and product plans.",
    badge: "Coming soon",
  },
];

const TOP_LINKS = [
  { label: "Blog", href: LANDING_ROUTES.blog },
  { label: "Pricing", href: LANDING_ROUTES.pricing },
  { label: "Contact", href: LANDING_ROUTES.contact },
] as const;

function NavLink({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:bg-secondary hover:text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function ProductDropdownItem({ item, onNavigate }: { item: ProductItem; onNavigate?: () => void }) {
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className="group rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
    >
      <div className="flex items-center gap-2">
        <span className="text-[13.5px] font-semibold text-ink group-hover:text-primary">{item.label}</span>
        {item.badge && (
          <span className="rounded-full border border-border/80 bg-surface-1 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ink-soft">
            {item.badge}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[12px] text-ink-soft">{item.desc}</div>
    </Link>
  );
}

export const SiteHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const productMenuRef = useRef<HTMLLIElement>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setProductOpen(false);
    setMobile(false);
    setMobileProductOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!productOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!productMenuRef.current?.contains(event.target as Node)) {
        setProductOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [productOpen]);

  const closeMobile = () => {
    setMobile(false);
    setMobileProductOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          "relative flex w-full max-w-6xl items-center justify-between gap-6 rounded-2xl px-4 py-2.5 transition-all duration-500",
          scrolled || productOpen || mobile ? "glass-strong shadow-card border border-border/70" : "border border-transparent",
        )}
      >
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          <li
            ref={productMenuRef}
            className="relative"
            onMouseEnter={() => setProductOpen(true)}
            onMouseLeave={() => setProductOpen(false)}
          >
            <button
              type="button"
              onClick={() => setProductOpen((open) => !open)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors",
                productOpen ? "bg-secondary text-ink" : "text-ink-soft hover:bg-secondary hover:text-ink",
              )}
              aria-expanded={productOpen}
              aria-haspopup="true"
            >
              Product
              <ChevronDown
                className={cn("h-3.5 w-3.5 opacity-60 transition-transform", productOpen && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {productOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 top-full z-50 pt-2"
                >
                  <div
                    className="w-[360px] rounded-2xl border border-border bg-card p-2 shadow-elevated ring-1 ring-black/5 backdrop-blur-xl"
                    style={{ backgroundColor: "hsl(var(--card))" }}
                  >
                    <div className="flex flex-col">
                      {PRODUCT_ITEMS.map((item) => (
                        <ProductDropdownItem
                          key={item.href}
                          item={item}
                          onNavigate={() => setProductOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
          {TOP_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink to={link.href}>{link.label}</NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={buildLoginUrl({ ref: "header" })}
            className="hidden rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-soft hover:text-ink sm:block"
          >
            Sign in
          </a>
          <Link to={LANDING_ROUTES.pricing} className={inkCtaButtonClass()}>
            Get started
            <InkCtaArrow />
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setMobile((v) => !v)}
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-4 top-20 lg:hidden"
          >
            <div className="glass-strong max-h-[80vh] overflow-y-auto rounded-2xl border border-border/70 p-4 shadow-elevated">
              <div className="border-b border-border/60 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileProductOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[14px] font-semibold text-ink"
                  aria-expanded={mobileProductOpen}
                >
                  Product
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-ink-soft transition-transform",
                      mobileProductOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence>
                  {mobileProductOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 space-y-1 pl-1">
                        {PRODUCT_ITEMS.map((item) => (
                          <ProductDropdownItem key={item.href} item={item} onNavigate={closeMobile} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {TOP_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={closeMobile}
                  className="block rounded-lg px-2 py-3 text-[14px] font-medium text-ink hover:bg-secondary"
                >
                  {link.label}
                </Link>
              ))}

              <a
                href={buildLoginUrl({ ref: "header_mobile" })}
                className="block rounded-lg px-2 py-3 text-[14px] font-medium text-ink-soft hover:bg-secondary"
              >
                Sign in
              </a>
              <Link
                to={LANDING_ROUTES.pricing}
                onClick={closeMobile}
                className={cn(inkCtaButtonClass("mt-2 w-full justify-center"), "py-2.5")}
              >
                Get started
                <InkCtaArrow />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
