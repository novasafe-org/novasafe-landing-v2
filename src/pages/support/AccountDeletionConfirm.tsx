import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { confirmAccountDeletion } from "@/lib/accountDeletionApi";

export default function AccountDeletionConfirm() {
  const [params] = useSearchParams();
  const email = (params.get("email") || "").trim();
  const token = (params.get("token") || "").trim();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!email || !token) {
        if (!cancelled) {
          setStatus("error");
          setMessage("This confirmation link is missing details. Request deletion again.");
        }
        return;
      }
      try {
        await confirmAccountDeletion(email, token);
        if (!cancelled) setStatus("success");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            err instanceof Error
              ? err.message
              : "Could not confirm deletion. Request a new link from the deletion page.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, token]);

  return (
    <PageShell>
      <section className="border-b border-border/60 pb-16 pt-4 sm:pb-20">
        <div className="container">
          <div className="mx-auto max-w-xl">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to NovaSafe
            </Link>

            <div className="mt-8 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-primary">
              Account
            </div>
            <h1 className="mt-3 text-balance text-[36px] font-semibold leading-tight tracking-tight text-ink sm:text-[44px]">
              Confirm account deletion
            </h1>

            <div className="mt-10 rounded-2xl border border-border/70 bg-card/90 p-8 text-center shadow-sm">
              {status === "loading" && (
                <>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink-soft" />
                  <p className="mt-4 text-[15px] text-ink-soft">Confirming your request…</p>
                </>
              )}
              {status === "success" && (
                <>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                    Account deleted
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                    Your NovaSafe account and vault data have been removed.
                  </p>
                </>
              )}
              {status === "error" && (
                <>
                  <h2 className="text-lg font-semibold tracking-tight text-ink">
                    Couldn&apos;t confirm
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{message}</p>
                  <Link
                    to="/account/deletion"
                    className="mt-6 inline-block text-[14px] font-medium text-primary hover:underline"
                  >
                    Request deletion again
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
