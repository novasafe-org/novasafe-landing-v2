import { motion } from "framer-motion";
import { Handshake, HelpCircle, MessageSquare, ShieldAlert, type LucideIcon } from "lucide-react";

import type { ContactCategory } from "@/lib/contactApi";
import { cn } from "@/lib/utils";

export type CategoryCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: ContactCategory;
};

export const CATEGORY_CARDS: CategoryCard[] = [
  {
    id: "general",
    title: "General Questions",
    description: "Product information, pricing and feedback.",
    icon: HelpCircle,
    category: "General Question",
  },
  {
    id: "support",
    title: "Technical Support",
    description: "Help with accounts, vaults and authentication.",
    icon: MessageSquare,
    category: "Technical Support",
  },
  {
    id: "security",
    title: "Security",
    description: "Report vulnerabilities or security concerns.",
    icon: ShieldAlert,
    category: "Security Issue",
  },
  {
    id: "partnership",
    title: "Partnerships",
    description: "Business, integrations and collaboration.",
    icon: Handshake,
    category: "Partnership",
  },
];

type CategoryPickerProps = {
  selected: ContactCategory | "";
  onSelect: (category: ContactCategory) => void;
};

export function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-ink">How can we help?</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
        Choose the reason you&apos;re reaching out.
      </p>

      <div className="mt-5 space-y-2.5">
        {CATEGORY_CARDS.map((card, index) => {
          const Icon = card.icon;
          const isActive = selected === card.category;

          return (
            <motion.button
              key={card.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              onClick={() => onSelect(card.category)}
              className={cn(
                "group relative w-full rounded-2xl border p-4 text-left transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-md",
                isActive
                  ? "border-primary/40 bg-primary/[0.04] shadow-md shadow-primary/[0.08]"
                  : "border-border/70 bg-card/80 shadow-sm hover:border-primary/25",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                  "bg-gradient-to-br from-primary/8 via-transparent to-transparent",
                  isActive ? "opacity-100" : "group-hover:opacity-60",
                )}
              />
              <div className="relative flex items-start gap-3.5">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-primary/10 text-primary group-hover:bg-primary/15",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className="text-[14px] font-semibold text-ink">{card.title}</div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
                    {card.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
