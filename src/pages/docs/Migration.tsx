import { DocsLayout, CodeBlock } from "@/components/site/DocsLayout";
import { docsNav } from "./_nav";

export default () => (
  <DocsLayout nav={docsNav} title="Migration guides" lede="Step-by-step instructions to move your vault from any major provider.">
    {[
      { p: "1Password", note: "Export as .1pif from Settings → Export.", cmd: `novasafe import --from=1password ./vault.1pif` },
      { p: "LastPass",  note: "Export as CSV from Advanced Options → Export.", cmd: `novasafe import --from=lastpass ./vault.csv` },
      { p: "Bitwarden", note: "Export as encrypted JSON via Tools → Export.", cmd: `novasafe import --from=bitwarden ./vault.json` },
      { p: "Dashlane",  note: "Export as CSV from My Account → Settings.", cmd: `novasafe import --from=dashlane ./vault.csv` },
      { p: "Apple Keychain", note: "Use macOS Passwords app → Export passwords.", cmd: `novasafe import --from=keychain ./vault.csv` },
    ].map((g) => (
      <div key={g.p}>
        <h2 className="text-[20px] font-semibold text-ink">From {g.p}</h2>
        <p>{g.note}</p>
        <CodeBlock lang="bash" code={g.cmd} />
      </div>
    ))}
  </DocsLayout>
);
