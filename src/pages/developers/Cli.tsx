import { DocsLayout, CodeBlock } from "@/components/site/DocsLayout";
import { devNav } from "./_nav";

export default () => (
  <DocsLayout nav={devNav} title="CLI" lede="A single binary for managing vaults, secrets, and runtime injection. Works on macOS, Linux, Windows, and inside any CI runner.">
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Install</h2>
      <CodeBlock lang="bash" code={`# macOS / Linux
curl -fsSL https://novasafe.app/install.sh | sh

# Windows (PowerShell)
iwr https://novasafe.app/install.ps1 -useb | iex

# Homebrew
brew install novasafe/tap/novasafe`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Sign in</h2>
      <CodeBlock lang="bash" code={`$ novasafe login
→ Opening browser… signed in as you@acme.com
→ Default org: acme-inc`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Run with secrets</h2>
      <CodeBlock lang="bash" code={`# Inject secrets into the process — never written to disk
$ novasafe run --env=prod -- node server.js

# Pull a single value
$ novasafe get STRIPE_KEY --env=prod

# Rotate
$ novasafe rotate STRIPE_KEY --propagate`} />
    </div>
  </DocsLayout>
);
