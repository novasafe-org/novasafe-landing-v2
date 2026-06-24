import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { inkCtaButtonClass, InkCtaArrow } from "@/components/site/primitives";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  submitContactForm,
  type ContactCategory,
  type ContactFormPayload,
} from "@/lib/contactApi";
import { cn } from "@/lib/utils";

const CATEGORIES: ContactCategory[] = [
  "General Question",
  "Technical Support",
  "Security Issue",
  "Partnership",
  "Feature Request",
  "Other",
];

const fieldClass = cn(
  "h-12 rounded-xl border-border/70 bg-background px-4 text-[15px] shadow-sm",
  "transition-all placeholder:text-muted-foreground",
  "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
);

const textareaClass = cn(
  "min-h-[140px] rounded-xl border-border/70 bg-background px-4 py-3 text-[15px] leading-relaxed shadow-sm",
  "transition-all placeholder:text-muted-foreground",
  "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
);

type ContactFormPanelProps = {
  category: ContactCategory | "";
  onCategoryChange: (category: ContactCategory) => void;
};

export function ContactFormPanel({ category, onCategoryChange }: ContactFormPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [categoryError, setCategoryError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!category) {
      setCategoryError(true);
      return;
    }
    setCategoryError(false);

    const payload: ContactFormPayload = {
      name: name.trim(),
      email: email.trim(),
      category,
      message: message.trim(),
    };

    if (!payload.name || !payload.email || !payload.message) return;

    setStatus("loading");

    try {
      await submitContactForm(payload);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/90 p-10 text-center shadow-lg backdrop-blur"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10"
        >
          <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
        </motion.div>
        <h3 className="mt-6 text-xl font-semibold tracking-tight text-ink">
          Message sent successfully.
        </h3>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-soft">
          We&apos;ll get back to you as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => {
            setName("");
            setEmail("");
            setMessage("");
            setStatus("idle");
          }}
          className="mt-8 text-[14px] font-medium text-primary transition-colors hover:text-primary/80"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-lg backdrop-blur sm:p-8"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="contact-name" className="text-[13px] font-medium text-ink">
              Name
            </label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-email" className="text-[13px] font-medium text-ink">
              Email
            </label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-category" className="text-[13px] font-medium text-ink">
            Category
          </label>
          <Select
            value={category || undefined}
            onValueChange={(v) => {
              onCategoryChange(v as ContactCategory);
              setCategoryError(false);
            }}
            required
          >
            <SelectTrigger
              id="contact-category"
              className={cn(
                fieldClass,
                "h-12",
                categoryError && "border-destructive/50 ring-1 ring-destructive/20",
              )}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70">
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="rounded-lg text-[14px]">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryError && (
            <p className="text-[12px] text-destructive">Please select a category.</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-message" className="text-[13px] font-medium text-ink">
            Message
          </label>
          <Textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how we can help..."
            required
            className={textareaClass}
          />
        </div>

        <AnimatePresence mode="wait">
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
            >
              Something went wrong. Please try again or email us at support@novasafe.io.
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            inkCtaButtonClass("w-full justify-center py-3 text-[14px]"),
            status === "loading" && "pointer-events-none opacity-60",
          )}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Message
              <InkCtaArrow />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
