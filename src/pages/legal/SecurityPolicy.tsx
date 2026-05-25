import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L } from "./_sections";
export default () => (
  <LegalLayout title="Security Policy" updated="April 12, 2026" intro="NovaSafe's security program covers product, infrastructure, and operations. This policy summarizes our controls; the full architecture is documented in our whitepaper."
    sections={[
      { id: "encryption", title: "1. Cryptographic controls", body: <L items={["AES-256-GCM for vault items","Argon2id for password-derived keys","X25519 for sharing & device pairing","TLS 1.3 with mTLS between internal services","FIPS 140-3 validated modules in regulated regions"]} /> },
      { id: "access", title: "2. Access management", body: <P>All employee access requires SSO + hardware-key 2FA. Production access is just-in-time, peer-approved, and recorded. No standing administrative privileges.</P> },
      { id: "infra", title: "3. Infrastructure", body: <L items={["Multi-region deployment (US, EU, APAC)","Tenant-isolated storage with per-tenant data-encryption keys","Automated patching and vulnerability scanning","30-day point-in-time recovery"]} /> },
      { id: "monitoring", title: "4. Monitoring & response", body: <P>24/7 SOC monitoring with on-call rotation. Mean time to detect: under 10 minutes. Mean time to mitigate: under 60 minutes for critical incidents.</P> },
      { id: "testing", title: "5. Testing", body: <P>Quarterly external penetration tests. Continuous automated security testing in CI. Annual red-team engagement. Reports available under NDA.</P> },
    ]} />
);
