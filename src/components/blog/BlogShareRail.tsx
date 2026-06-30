import { cn } from "@/lib/utils";
import {
  buildShareUrl,
  openShareWindow,
  type SharePlatform,
} from "@/lib/socialShare";

const PLATFORMS: { id: SharePlatform; label: string }[] = [
  { id: "x", label: "Share on X" },
  { id: "telegram", label: "Share on Telegram" },
  { id: "reddit", label: "Share on Reddit" },
  { id: "linkedin", label: "Share on LinkedIn" },
  { id: "facebook", label: "Share on Facebook" },
];

function ShareIcon({ platform, className }: { platform: SharePlatform; className?: string }) {
  const props = { className, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const };

  switch (platform) {
    case "x":
      return (
        <svg {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...props}>
          <path d="M22.5 2.5 2.9 10.2c-.9.4-.9 1.6 0 2l5.2 1.8 2 6.3c.3.9 1.5 1 2 .2l3-3.8 5.2 3.8c.8.6 1.9.1 2.1-.9L24 4.4c.2-1.1-.8-2-2.5-1.9zM8.4 13.1l9.7-6.1-7.5 7.9-.3 3.2-1.9-4.9z" />
        </svg>
      );
    case "reddit":
      return (
        <svg {...props}>
          <path d="M14.5 11.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5zm-5 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-3.57-1.13c.04-.3.06-.61.06-.92 0-3.31-2.69-6-6-6-1.01 0-1.97.25-2.8.7a4.24 4.24 0 0 0-7.98 2.1h-.02a3.08 3.08 0 0 0-3.08 3.08c0 .37.07.73.19 1.07A6 6 0 0 0 3 12.38c0 3.31 2.69 6 6 6 1.45 0 2.78-.51 3.82-1.36.62.12 1.26.18 1.92.18 4.97 0 9.01-3.8 9.44-8.63z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...props}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...props}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return null;
  }
}

function ShareButton({
  platform,
  label,
  url,
  title,
  className,
}: {
  platform: SharePlatform;
  label: string;
  url: string;
  title: string;
  className?: string;
}) {
  const handleClick = () => {
    openShareWindow(buildShareUrl(platform, { url, title }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-primary",
        "transition-all duration-200 hover:border-primary/25 hover:bg-primary/10 hover:text-primary hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <ShareIcon platform={platform} className="h-[18px] w-[18px]" />
    </button>
  );
}

export function BlogShareRail({
  url,
  title,
  variant = "rail",
  sticky = true,
  className,
}: {
  url: string;
  title: string;
  variant?: "rail" | "inline";
  sticky?: boolean;
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Share</span>
        {PLATFORMS.map((p) => (
          <ShareButton key={p.id} platform={p.id} label={p.label} url={url} title={title} className="h-9 w-9" />
        ))}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        sticky && "lg:sticky lg:top-28 lg:self-start",
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft leading-none">Share</div>
      <div className="mt-3 flex flex-col gap-2">
        {PLATFORMS.map((p) => (
          <ShareButton key={p.id} platform={p.id} label={p.label} url={url} title={title} />
        ))}
      </div>
    </aside>
  );
}
