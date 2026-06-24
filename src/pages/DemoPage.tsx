import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { DemoVaultApp } from "@/demo/DemoVaultApp";
import { DemoWelcomeModal, wasDemoWelcomeDismissed } from "@/demo/DemoWelcomeModal";
import { LANDING_ROUTES } from "@/config";

export default function DemoPage() {
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!wasDemoWelcomeDismissed()) setWelcomeOpen(true);
  }, []);

  return (
    <PageShell>
      <div className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link
            to={LANDING_ROUTES.home}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit demo
          </Link>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Interactive demo</span>
          <div className="w-20" aria-hidden />
        </div>
      </div>

      <div className="container py-6 md:py-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl">
          <DemoVaultApp variant="full" className="min-h-[min(90vh,880px)]" />
        </div>
        <p className="mx-auto mt-4 max-w-7xl text-center text-xs text-muted-foreground">
          Demo data only · Nothing is saved ·{" "}
          <Link to={LANDING_ROUTES.pricing} className="text-primary hover:underline">
            Create a free account
          </Link>{" "}
          to use NovaSafe for real
        </p>
      </div>

      <DemoWelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />
    </PageShell>
  );
}
