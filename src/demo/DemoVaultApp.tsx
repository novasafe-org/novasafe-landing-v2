import { useCallback, useMemo, useState, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Cloud,
  Copy,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  FileText,
  Github,
  Globe,
  Key,
  KeyRound,
  Layout,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Server,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Triangle,
  Wifi,
  Pencil,
  Archive,
} from "lucide-react";
import { toast } from "sonner";

import { DEMO_VAULT_ITEMS } from "./data";
import type { DemoNavView, DemoVaultItem } from "./types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  github: Github,
  globe: Globe,
  "credit-card": CreditCard,
  key: Key,
  cloud: Cloud,
  server: Server,
  mail: Mail,
  shield: Shield,
  "file-text": FileText,
  "message-square": MessageSquare,
  database: Database,
  triangle: Triangle,
  activity: Activity,
  wifi: Wifi,
  layout: Layout,
  sparkles: Sparkles,
  "key-round": KeyRound,
};

function ItemIcon({ item, size = "md" }: { item: DemoVaultItem; size?: "sm" | "md" }) {
  const Icon = ICONS[item.icon] ?? Key;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
        item.color,
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </div>
  );
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase();
}

function relativeUpdated(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated 1d ago";
  return `Updated ${days}d ago`;
}

export type DemoVaultAppProps = {
  variant?: "compact" | "full";
  className?: string;
  /** Initial selected item id */
  defaultSelectedId?: string;
};

export function DemoVaultApp({ variant = "full", className, defaultSelectedId }: DemoVaultAppProps) {
  const isCompact = variant === "compact";
  const [items, setItems] = useState(DEMO_VAULT_ITEMS);
  const [nav, setNav] = useState<DemoNavView>("vault");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? items[0]?.id ?? "");
  const [revealed, setRevealed] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const filtered = useMemo(() => {
    let list = [...items];
    if (nav === "favorites") list = list.filter((i) => i.favorite);
    else if (nav === "cards") list = list.filter((i) => i.category === "card");
    else if (nav === "notes") list = list.filter((i) => i.category === "note");

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.username.toLowerCase().includes(q) ||
          (i.website?.toLowerCase().includes(q) ?? false) ||
          i.tag.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [items, nav, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, DemoVaultItem[]>();
    for (const item of filtered) {
      const key = monthLabel(item.updatedAt);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [filtered]);

  const toggleFavorite = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)));
  }, []);

  const copyPassword = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }, []);

  const selectItem = (id: string) => {
    setSelectedId(id);
    setRevealed(false);
  };

  const listTitle =
    nav === "favorites" ? "Favorites" : nav === "cards" ? "Cards" : nav === "notes" ? "Notes" : "All items";

  return (
    <div className={cn("flex flex-col overflow-hidden bg-background", className)}>
      {/* Top bar — full demo only */}
      {!isCompact && (
        <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 px-4 py-2.5">
          <div className="relative flex-1 max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your vault…"
              className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" aria-label="Dark mode">
            <Moon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            AM
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Icon rail */}
        <nav className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border/60 bg-surface-1/50 py-3 sm:flex">
          {(
            [
              { id: "vault" as const, icon: Shield, label: "Vault" },
              { id: "favorites" as const, icon: Star, label: "Favorites" },
              { id: "cards" as const, icon: CreditCard, label: "Cards" },
              { id: "notes" as const, icon: FileText, label: "Notes" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => setNav(id)}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                nav === id && "text-primary",
              )}
            >
              {nav === id && (
                <motion.span
                  layoutId="demo-nav-indicator"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                />
              )}
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </nav>

        {/* Item list */}
        <main
          className={cn(
            "flex min-w-0 shrink-0 flex-col border-r border-border/60",
            isCompact ? "w-[44%] max-w-[220px]" : "w-56 lg:w-64",
          )}
        >
          {isCompact && (
            <div className="border-b border-border/50 px-3 py-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-background/80 px-2 py-1.5 text-[10px] text-muted-foreground ring-1 ring-border">
                <Search className="h-3 w-3 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="min-w-0 flex-1 bg-transparent outline-none"
                />
              </div>
            </div>
          )}
          <div className="border-b border-border/50 px-3 py-2.5 sm:px-4">
            <h3 className="text-sm font-semibold text-ink">{listTitle}</h3>
            <p className="text-[11px] text-muted-foreground">{filtered.length} items · Encrypted on device</p>
          </div>
          <div className={cn("flex-1 overflow-y-auto", isCompact ? "max-h-[240px]" : "max-h-[min(75vh,600px)]")}>
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No items match your search.</p>
            ) : (
              grouped.map(([month, monthItems]) => (
                <div key={month}>
                  <p className="sticky top-0 z-10 bg-background/95 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground backdrop-blur sm:px-4">
                    {month}
                  </p>
                  <ul>
                    {monthItems.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectItem(item.id)}
                          className={cn(
                            "group flex w-full items-center gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors sm:gap-3 sm:px-4",
                            selectedId === item.id
                              ? "border-l-primary bg-primary/5"
                              : "border-l-transparent hover:bg-secondary/40",
                          )}
                        >
                          <ItemIcon item={item} size={isCompact ? "sm" : "md"} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-semibold text-ink sm:text-[13px]">{item.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground sm:text-[11px]">{item.username}</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className="shrink-0 p-0.5 text-muted-foreground hover:text-amber-500"
                            aria-label={item.favorite ? "Remove favorite" : "Add favorite"}
                          >
                            <Star
                              className={cn("h-3.5 w-3.5", item.favorite && "fill-amber-400 text-amber-400")}
                            />
                          </button>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Details panel — compact hero preview */}
        {isCompact && (
          <section className="flex min-w-0 flex-1 flex-col border-l border-border/60 bg-card/30">
            {selected ? (
              <div className="flex flex-1 flex-col overflow-y-auto p-3 text-left">
                <div className="flex items-center gap-2">
                  <ItemIcon item={selected} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold text-ink">{selected.name}</div>
                    <div className="truncate text-[9px] text-muted-foreground">{selected.username}</div>
                  </div>
                </div>
                <p className="mt-2 font-mono text-[10px] text-ink-soft">
                  {revealed ? selected.password : "••••••••••••"}
                </p>
                <button
                  type="button"
                  onClick={() => setRevealed((r) => !r)}
                  className="mt-2 inline-flex items-center gap-1 text-[9px] font-medium text-primary"
                >
                  {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {revealed ? "Hide" : "Reveal"}
                </button>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-dashed border-border/80 px-3 py-1.5 text-[9px] text-muted-foreground">
              <span className="font-mono">e2e encrypted · zero-knowledge</span>
              <span className="font-medium text-success">● synced</span>
            </div>
          </section>
        )}

        {/* Details panel — full demo */}
        {!isCompact && (
          <section className="hidden min-w-0 flex-1 flex-col border-l border-border/60 bg-card/30 lg:flex">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
                    <div className="w-full max-w-lg text-left">
                      <div className="mb-8 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ItemIcon item={selected} />
                          <div>
                            <h2 className="text-lg font-semibold text-ink">{selected.name}</h2>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                                {selected.category}
                              </span>
                              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {selected.tag}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{relativeUpdated(selected.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(selected.id)}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                            aria-label="Favorite"
                          >
                            <Star className={cn("h-4 w-4", selected.favorite && "fill-amber-400 text-amber-400")} />
                          </button>
                        </div>
                      </div>

                      <dl className="space-y-6 text-sm">
                        <div>
                          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Username</dt>
                          <dd className="mt-1.5 font-medium text-ink">{selected.username}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Password</dt>
                          <dd className="mt-1.5 font-mono tracking-widest text-ink">
                            {revealed ? selected.password : "••••••••••••••••"}
                          </dd>
                        </div>
                        {selected.website && (
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Website</dt>
                            <dd className="mt-1.5">
                              <a
                                href={`https://${selected.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                onClick={(e) => e.preventDefault()}
                              >
                                <Globe className="h-3.5 w-3.5" />
                                {selected.website}
                              </a>
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Notes</dt>
                          <dd className="mt-1.5 text-ink-soft">{selected.notes || "Add notes…"}</dd>
                        </div>
                      </dl>

                      <div className="mt-10">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Custom fields</p>
                        <p className="mt-2 text-sm text-muted-foreground">No custom fields added</p>
                        <button
                          type="button"
                          className="mt-3 inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
                        >
                          <Plus className="h-3 w-3" /> Add field
                        </button>
                      </div>

                      <div className="mt-10">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Password history</p>
                        <div className="mt-3 rounded-xl border border-border/70 bg-background/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-sm tracking-widest text-ink">
                                {revealed ? selected.password : "••••••••••••••••"}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground">{relativeUpdated(selected.updatedAt)}</p>
                            </div>
                            <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Current
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setRevealed((r) => !r)}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
                            >
                              {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {revealed ? "Hide" : "Reveal"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void copyPassword(selected.password)}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
                            >
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-6 py-3 text-[11px] text-muted-foreground lg:px-8">
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> End-to-end encrypted
                    </span>
                    <div className="flex gap-2">
                      <button type="button" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:bg-secondary">
                        <Archive className="h-3 w-3" /> Archive
                      </button>
                      <button type="button" className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                    <FileText className="h-8 w-8" />
                  </div>
                  <p className="mt-4 font-semibold text-ink">Select an item</p>
                  <p className="mt-1 text-sm text-muted-foreground">Pick anything from the list to view its details</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>
    </div>
  );
}
