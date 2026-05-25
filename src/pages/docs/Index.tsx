import { DocsLayout } from "@/components/site/DocsLayout";
import { docsNav } from "./_nav";
import { Link } from "react-router-dom";

export default () => (
  <DocsLayout nav={docsNav} title="Documentation" lede="Everything you need to deploy, integrate, and operate NovaSafe.">
    <p>Pick a path:</p>
    <ul className="ml-5 list-disc space-y-2">
      <li><Link to="/docs/getting-started" className="text-primary hover:underline">Getting started</Link> — Create your first vault.</li>
      <li><Link to="/developers/api" className="text-primary hover:underline">API Reference</Link> — Build on the platform.</li>
      <li><Link to="/developers/cli" className="text-primary hover:underline">CLI</Link> — Inject secrets at runtime.</li>
      <li><Link to="/docs/migration" className="text-primary hover:underline">Migration</Link> — Move from another provider.</li>
    </ul>
  </DocsLayout>
);
