import { DocsLayout, CodeBlock } from "@/components/site/DocsLayout";
import { devNav } from "./_nav";

export default () => (
  <DocsLayout nav={devNav} title="SDKs" lede="First-party SDKs maintained by the NovaSafe team. All SDKs use the same client-side encryption primitives — no plaintext leaves your app.">
    <div>
      <h2 className="text-[22px] font-semibold text-ink">TypeScript / JavaScript</h2>
      <CodeBlock lang="bash" code={`npm install @novasafe/sdk`} />
      <CodeBlock lang="ts" code={`import { NovaSafe } from "@novasafe/sdk";

const vault = new NovaSafe({ token: process.env.NOVASAFE_TOKEN });
const item = await vault.items.create({
  name: "Acme Prod",
  type: "login",
  data: { username: "deploy", password: "..." },
});`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Python</h2>
      <CodeBlock lang="bash" code={`pip install novasafe`} />
      <CodeBlock lang="python" code={`from novasafe import NovaSafe
vault = NovaSafe(token=os.environ["NOVASAFE_TOKEN"])
item = vault.items.create(name="Acme Prod", type="login",
                          data={"username": "deploy", "password": "..."})`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Go</h2>
      <CodeBlock lang="bash" code={`go get github.com/novasafe/novasafe-go`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Other languages</h2>
      <p>Rust, Ruby, Java, and .NET SDKs are in public beta. Community SDKs exist for Elixir, PHP, and Swift.</p>
    </div>
  </DocsLayout>
);
