import { DocsLayout, CodeBlock } from "@/components/site/DocsLayout";
import { devNav } from "./_nav";

export default () => (
  <DocsLayout nav={devNav} title="API Reference" lede="REST endpoints over HTTPS, JSON in and out. All requests must be authenticated with a bearer token issued from your dashboard.">
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Base URL</h2>
      <CodeBlock lang="http" code={`https://api.novasafe.app/v1`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Authentication</h2>
      <p>Pass a bearer token in the Authorization header. Tokens are scoped to a specific organization and environment.</p>
      <CodeBlock lang="http" code={`Authorization: Bearer ns_live_8f4a...
Content-Type: application/json
X-Novasafe-Version: 2026-01-15`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Create a vault item</h2>
      <CodeBlock lang="bash" code={`curl https://api.novasafe.app/v1/items \\
  -H "Authorization: Bearer ns_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "vault_id": "vlt_8f4a",
    "type": "login",
    "name": "Acme Production",
    "ciphertext": "AES256GCM:..."
  }'`} />
      <CodeBlock lang="json" code={`{
  "id": "itm_2A9c...",
  "vault_id": "vlt_8f4a",
  "type": "login",
  "created": 1737936000,
  "version": 1
}`} />
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Endpoints</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li><code>POST /v1/items</code> — create</li>
        <li><code>GET /v1/items/:id</code> — retrieve</li>
        <li><code>PATCH /v1/items/:id</code> — update</li>
        <li><code>DELETE /v1/items/:id</code> — soft-delete</li>
        <li><code>POST /v1/share</code> — create share link</li>
        <li><code>POST /v1/audit</code> — query events</li>
      </ul>
    </div>
  </DocsLayout>
);
