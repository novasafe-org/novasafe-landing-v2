import { DocsLayout, CodeBlock } from "@/components/site/DocsLayout";
import { docsNav } from "./_nav";

export default () => (
  <DocsLayout nav={docsNav} title="Getting started" lede="From sign-up to your first synced credential in under five minutes.">
    <div>
      <h2 className="text-[22px] font-semibold text-ink">1. Create an account</h2>
      <p>Sign up at app.novasafe.app. Choose a strong master password — this is the only credential we cannot recover for you. NovaSafe will generate recovery codes during onboarding; print and store them somewhere safe.</p>
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">2. Install on your devices</h2>
      <CodeBlock lang="bash" code={`# macOS
brew install --cask novasafe

# iOS / Android
Available on the App Store and Google Play

# Browser
chrome.google.com/webstore/detail/novasafe`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">3. Import existing credentials</h2>
      <p>Use the import wizard or run the CLI command. We support 1Password, LastPass, Bitwarden, Dashlane, Apple Keychain, and CSV.</p>
      <CodeBlock lang="bash" code={`novasafe import --from=1password ./export.1pif`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">4. Set up recovery</h2>
      <p>Visit Settings → Recovery and configure at least two of: recovery codes, hardware key, emergency contacts.</p>
    </div>
  </DocsLayout>
);
