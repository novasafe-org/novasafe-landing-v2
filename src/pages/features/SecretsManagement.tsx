import { Terminal, GitBranch, Layers, ShieldCheck, RefreshCw, Lock } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Secrets management"
  title={<>API keys & env vars, <span className="text-gradient-primary">treated like production.</span></>}
  lede="A first-class secrets manager for engineering teams. CLI-native, Git-aware, CI/CD-ready — and built on the same zero-knowledge core."
  benefits={[
    { icon: Terminal, title: "CLI-first", desc: "Pull secrets inline: novasafe run -- npm start." },
    { icon: Layers, title: "Environments", desc: "dev / staging / prod, with separate access controls." },
    { icon: GitBranch, title: "Versioned", desc: "Every change tracked. Rollback in one command." },
    { icon: RefreshCw, title: "Auto-rotation", desc: "Native rotation for AWS, GCP, Stripe, Twilio, more." },
    { icon: ShieldCheck, title: "Audit trail", desc: "Every read & write streamed to your SIEM." },
    { icon: Lock, title: "Per-key encryption", desc: "Each secret wrapped with a unique data-encryption key." },
  ]}
  codeLang="bash"
  codeSample={`# Inject prod secrets into your app — never on disk
$ novasafe run -- node server.js

# Add a secret from CI
$ novasafe set STRIPE_KEY=sk_live_... --env=prod

# Rotate a secret across all services
$ novasafe rotate STRIPE_KEY --propagate
✓ Updated in Vercel, AWS, GitHub Actions (3 targets)`}
/>;
