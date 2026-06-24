import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Key, Lock, Shield, Wifi } from "lucide-react";
import { Link } from "react-router-dom";

import { DemoVaultApp } from "@/demo/DemoVaultApp";
import { LANDING_ROUTES } from "@/config";

export const VaultPreview = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -4]), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 120, damping: 20 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/30 via-primary-glow/20 to-transparent blur-3xl" />

      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        className="relative [transform-style:preserve-3d]"
      >
        <div className="glass-strong relative overflow-hidden rounded-[1.75rem] border border-border/70 shadow-elevated">
          {/* Window chrome — keep URL bar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-surface-1/60 px-4 py-2.5 sm:px-5 sm:py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-secondary/70 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
              <Lock className="h-3 w-3 text-success" />
              vault.novasafe.app
            </div>
            <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <Link
            to={LANDING_ROUTES.demo}
            className="block transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Open live demo"
          >
            <DemoVaultApp variant="compact" className="min-h-[280px] sm:min-h-[300px]" />
          </Link>
        </div>
      </motion.div>

      {/* Floating cards */}
      <motion.div
        className="pointer-events-none absolute -left-8 -top-8 hidden w-[200px] rotate-[-6deg] glass rounded-2xl border border-border/70 p-3 shadow-card sm:block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Key className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-ink">Master key</div>
            <div className="font-mono text-[10px] text-muted-foreground">derived · argon2id</div>
          </div>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-primary to-primary-glow" />
        </div>
        <div className="mt-1 text-right text-[9.5px] font-medium text-success">Strength: Excellent</div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute -right-6 top-20 hidden w-[185px] rotate-[5deg] glass rounded-2xl border border-border/70 p-3 shadow-card md:block"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Encryption</span>
          <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
        </div>
        <div className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-ink-soft">
          <div>
            <span className="text-muted-foreground">algo</span> = <span className="text-primary">XChaCha20</span>
          </div>
          <div>
            <span className="text-muted-foreground">kdf</span> = <span className="text-primary">argon2id</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute -bottom-4 left-10 hidden w-[220px] rotate-[3deg] glass rounded-2xl border border-border/70 p-3 shadow-card sm:block"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/15 text-success">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-ink">Zero-knowledge proof</div>
            <div className="text-[10px] text-muted-foreground">Verified just now · server can&apos;t read</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
