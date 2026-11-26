import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { inkCtaButtonClass, InkCtaArrow } from "@/components/site/primitives";
import { Input } from "@/components/ui/input";
import { requestAccountDeletion } from "@/lib/accountDeletionApi";
import { cn } from "@/lib/utils";

const fieldClass = cn(
  "h-12 rounded-xl border-border/70 bg-background px-4 text-[15px] shadow-sm",
  "transition-all placeholder:text-muted-foreground",
  "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
);

export default function AccountDeletion() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("loading");
    try {
      await requestAccountDeletion(trimmed);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

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
              Delete your NovaSafe account
            </h1>
            <p className="mt-5 text-[16px] leading-[1.75] text-ink-soft">
              Submit the form below and we&apos;ll start deleting your account.
            </p>

            <p
              className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[14px] leading-relaxed text-ink"
              role="note"
            >
              This permanently deletes your account and everything in it, including
              secrets, vault items, folders, documents, and any other data tied to
              the account. It can&apos;t be undone.
            </p>

            {status === "success" ? (
              <div className="mt-10 rounded-2xl border border-border/70 bg-card/90 p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                  Request received
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                  Check your inbox for a confirmation link. Open it to finish deleting the account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                <div>
                  <label
                    htmlFor="deletion-email"
                    className="mb-2 block text-[13px] font-medium text-ink"
                  >
                    Account email
                  </label>
                  <Input
                    id="deletion-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={fieldClass}
                    disabled={status === "loading"}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className={cn(
                    inkCtaButtonClass("h-12 w-full justify-center rounded-xl px-5 text-[14px]"),
                    (status === "loading" || !email.trim()) && "pointer-events-none opacity-60",
                  )}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Request deletion
                      <InkCtaArrow />
                    </>
                  )}
                </button>

                {status === "error" && (
                  <p className="text-[13px] text-destructive">
                    Something went wrong. Try again, or email support@novasafe.io.
                  </p>
                )}

                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  We&apos;ll email you a confirmation link. Deletion only runs after you confirm.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
