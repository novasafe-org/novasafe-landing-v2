import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L, H } from "./_sections";
export default () => (
  <LegalLayout
    title="Security Policy"
    updated="April 12, 2026"
    intro="Security is the product. This policy summarises the controls NovaSafe operates to protect your vault, our infrastructure, and the people who build the service. It is reviewed quarterly and updated whenever our controls materially change."
    sections={[
      { id: "crypto", title: "Cryptographic architecture", body: <>
        <P>NovaSafe is built around a client-side, zero-knowledge model. Every vault item is encrypted on your device before it leaves; the server only ever sees opaque ciphertext.</P>
        <H>Primitives</H>
        <L items={[
          "AES-256-GCM for symmetric encryption of vault items and attachments.",
          "Argon2id (memory-hard) for deriving your master key from your master password.",
          "X25519 for asymmetric key exchange used in sharing and new-device pairing.",
          "Ed25519 for signatures across sync and audit records.",
          "TLS 1.3 for all network transport, with HSTS and certificate pinning in our mobile clients.",
        ]} />
        <P>A more detailed description of our key hierarchy, sharing protocol, and threat model is available in the NovaSafe Security Whitepaper, which we publish openly.</P>
      </> },
      { id: "access", title: "Access management", body: <>
        <P>All employee access to NovaSafe systems requires single sign-on with hardware-backed multi-factor authentication. Production access is just-in-time: engineers request a time-bound role, the request is approved by a peer, and every action taken under that role is recorded.</P>
        <P>There are no standing administrative privileges in production. Access is reviewed quarterly, and is revoked automatically when an employee changes roles or leaves the company.</P>
      </> },
      { id: "infra", title: "Infrastructure", body: <>
        <L items={[
          "Production runs in hardened cloud regions in North America and the European Union.",
          "Storage is tenant-isolated with per-tenant data-encryption keys.",
          "Operating systems and container images are rebuilt and re-deployed at least weekly with the latest security patches.",
          "All servers are immutable; configuration changes are made by re-deploying, not by editing in place.",
          "Backups are encrypted, tested monthly, and retained for 30 days for point-in-time recovery.",
        ]} />
      </> },
      { id: "sdlc", title: "Secure development lifecycle", body: <>
        <P>Every code change is peer-reviewed and runs through automated static analysis, dependency scanning, and unit and integration tests before it can be merged. Sensitive areas of the codebase — cryptography, authentication, sharing — require an additional review by a designated security owner.</P>
        <P>We use reproducible builds for our client applications so that the binaries we ship can be independently verified against the published source.</P>
      </> },
      { id: "monitor", title: "Monitoring and incident response", body: <>
        <P>Production systems are monitored continuously for anomalous behaviour. An on-call engineer is available around the clock, with a documented incident response runbook and a target time to detect under 10 minutes for critical events.</P>
        <P>If we ever experience a security incident that affects customer data, we will notify affected customers without undue delay and publish a public post-mortem.</P>
      </> },
      { id: "testing", title: "Independent testing", body: <P>We engage independent security firms for an external penetration test at least once a year and for a focused review of any major new feature before launch. Summary reports are available to enterprise customers under NDA. We also run a private bug bounty programme — see the Responsible Disclosure policy.</P> },
      { id: "contact", title: "Contact", body: <P>Report security issues to security@novasafe.app. Our PGP key is published at novasafe.app/.well-known/pgp.txt.</P> },
    ]} />
);
