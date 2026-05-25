import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L } from "./_sections";
export default () => (
  <LegalLayout title="Responsible Disclosure" updated="March 5, 2026" intro="We deeply value the work of security researchers. This policy guarantees safe-harbor for good-faith reports."
    sections={[
      { id: "scope", title: "1. In scope", body: <L items={["*.novasafe.app","NovaSafe iOS, Android, and desktop applications","Official browser extensions","Published SDKs and CLI"]} /> },
      { id: "out", title: "2. Out of scope", body: <L items={["Denial-of-service attacks","Social engineering of NovaSafe staff or customers","Physical attacks on offices or datacenters","Findings from automated scanners without proof of exploitability"]} /> },
      { id: "safe", title: "3. Safe harbor", body: <P>We will not initiate legal action against researchers who follow this policy in good faith. Acting in good faith includes not accessing, modifying, or destroying user data beyond what is required to demonstrate the vulnerability.</P> },
      { id: "rewards", title: "4. Rewards", body: <P>Eligible reports receive bounties from $250 to $50,000 based on severity, exploitability, and impact. See HackerOne for the full schedule.</P> },
      { id: "submit", title: "5. How to submit", body: <P>security@novasafe.app (PGP key on /security) or via hackerone.com/novasafe. We acknowledge reports within 24 hours.</P> },
    ]} />
);
