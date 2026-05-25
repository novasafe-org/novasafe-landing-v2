import { ReactNode } from "react";
export const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;
export const L = ({ items }: { items: string[] }) => (
  <ul className="ml-5 list-disc space-y-1.5">{items.map((i) => <li key={i}>{i}</li>)}</ul>
);
