import type { DocsNavGroup } from "@/components/site/DocsLayout";
export const docsNav: DocsNavGroup[] = [
  { label: "Get started", items: [
    { label: "Introduction", href: "/docs" },
    { label: "Getting started", href: "/docs/getting-started" },
    { label: "Migration guides", href: "/docs/migration" },
  ]},
  { label: "Developers", items: [
    { label: "API Reference", href: "/developers/api" },
    { label: "SDKs", href: "/developers/sdks" },
    { label: "CLI", href: "/developers/cli" },
  ]},
  { label: "Support", items: [
    { label: "Help Center", href: "/help" },
    { label: "FAQs", href: "/faqs" },
    { label: "Account recovery", href: "/account-recovery" },
  ]},
];
