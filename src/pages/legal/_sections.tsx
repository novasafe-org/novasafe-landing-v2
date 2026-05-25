import { ReactNode } from "react";
export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-[15px] leading-[1.75] text-ink-soft">{children}</p>
);
export const L = ({ items }: { items: (string | ReactNode)[] }) => (
  <ul className="ml-5 list-disc space-y-2 text-[15px] leading-[1.75] text-ink-soft marker:text-primary/60">
    {items.map((i, idx) => <li key={idx}>{i}</li>)}
  </ul>
);
export const H = ({ children }: { children: ReactNode }) => (
  <h3 className="mt-6 text-[16px] font-semibold text-ink">{children}</h3>
);
