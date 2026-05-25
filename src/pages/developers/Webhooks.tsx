import { DocsLayout, CodeBlock } from "@/components/site/DocsLayout";
import { devNav } from "./_nav";

export default () => (
  <DocsLayout nav={devNav} title="Webhooks" lede="Subscribe to vault events in near real-time. Every payload is signed with HMAC-SHA256 — verify it before trusting.">
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Event types</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li><code>item.created</code>, <code>item.updated</code>, <code>item.deleted</code></li>
        <li><code>share.created</code>, <code>share.revoked</code></li>
        <li><code>member.added</code>, <code>member.removed</code></li>
        <li><code>policy.violated</code>, <code>audit.exported</code></li>
      </ul>
    </div>
    <div>
      <h2 className="text-[22px] font-semibold text-ink">Verifying signatures</h2>
      <CodeBlock lang="ts" code={`import crypto from "node:crypto";

export function verify(req: Request, secret: string) {
  const sig = req.headers.get("x-novasafe-signature")!;
  const ts  = req.headers.get("x-novasafe-timestamp")!;
  const body = await req.text();
  const mac = crypto.createHmac("sha256", secret)
    .update(\`\${ts}.\${body}\`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sig));
}`} />
    </div>
  </DocsLayout>
);
