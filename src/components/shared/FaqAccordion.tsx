import { Minus, Plus } from "lucide-react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

import type { FaqItem } from "@/data/faq-items";
import { cn } from "@/lib/utils";

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const Icon = item.icon;

  return (
    <AccordionPrimitive.Item
      value={item.id}
      className="group rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md data-[state=open]:border-primary/30 data-[state=open]:shadow-md data-[state=open]:shadow-primary/[0.06]"
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger
          className={cn(
            "group flex w-full items-start gap-4 rounded-2xl px-5 py-5 text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 group-data-[state=open]:bg-primary/15">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <span className="flex-1 pt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-ink sm:text-base">
            {item.question}
          </span>
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
            <Plus className="h-4 w-4 group-data-[state=open]:hidden" aria-hidden />
            <Minus className="hidden h-4 w-4 group-data-[state=open]:block" aria-hidden />
          </span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content
        className={cn(
          "overflow-hidden text-sm transition-all",
          "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        )}
      >
        <div className="px-5 pb-5 pl-[4.25rem] pr-14 text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
          {item.answer}
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

type FaqAccordionProps = {
  items: FaqItem[];
  className?: string;
};

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className={cn("space-y-3", className)}>
      {items.map((item) => (
        <FaqAccordionItem key={item.id} item={item} />
      ))}
    </AccordionPrimitive.Root>
  );
}
