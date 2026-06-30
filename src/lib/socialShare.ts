export type SharePlatform = "x" | "telegram" | "reddit" | "linkedin" | "facebook";

export interface SharePayload {
  url: string;
  title: string;
}

const encode = (value: string) => encodeURIComponent(value);

export const buildShareUrl = (platform: SharePlatform, { url, title }: SharePayload): string => {
  switch (platform) {
    case "x":
      return `https://twitter.com/intent/tweet?url=${encode(url)}&text=${encode(title)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encode(url)}&text=${encode(title)}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${encode(url)}&title=${encode(title)}`;
    case "linkedin":
      return `https://www.linkedin.com/feed/?shareActive=true&url=${encode(url)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`;
    default:
      return url;
  }
};

/** Opens platform share UI in a centered popup (LinkedIn compose, X intent, etc.). */
export const openShareWindow = (shareUrl: string): void => {
  const width = 640;
  const height = 720;
  const topWindow = window.top ?? window;
  const left = Math.max(0, (topWindow.outerWidth - width) / 2 + (topWindow.screenX ?? 0));
  const top = Math.max(0, (topWindow.outerHeight - height) / 2 + (topWindow.screenY ?? 0));

  window.open(
    shareUrl,
    "novasafe-share",
    `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`,
  );
};

export const resolveBlogShareUrl = (slug: string): string => {
  if (typeof window !== "undefined" && window.location.href) {
    return window.location.href.split("#")[0];
  }
  const origin = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") || "https://novasafe.app";
  return `${origin}/blog/${slug}`;
};
