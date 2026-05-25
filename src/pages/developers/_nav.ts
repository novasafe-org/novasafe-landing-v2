import type { DocsNavGroup } from "@/components/site/DocsLayout";
export const devNav: DocsNavGroup[] = [
  { label: "Overview", items: [
    { label: "Introduction", href: "/developers" },
    { label: "Authentication", href: "/developers/api" },
  ]},
  { label: "Reference", items: [
    { label: "API Reference", href: "/developers/api" },
    { label: "SDKs", href: "/developers/sdks" },
    { label: "CLI", href: "/developers/cli" },
    { label: "Webhooks", href: "/developers/webhooks" },
    { label: "Integrations", href: "/developers/integrations" },
  ]},
  { label: "Resources", items: [
    { label: "Changelog", href: "/changelog" },
    { label: "System Status", href: "/status" },
    { label: "Open Source", href: "/open-source" },
  ]},
];
