import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L } from "./_sections";
export default () => (
  <LegalLayout title="GDPR" updated="January 10, 2026" intro="How NovaSafe complies with the EU General Data Protection Regulation."
    sections={[
      { id: "lawful", title: "1. Lawful basis", body: <P>We process personal data on the basis of contract performance (Art. 6(1)(b)) and legitimate interest in service security (Art. 6(1)(f)).</P> },
      { id: "rights", title: "2. Data-subject rights", body: <L items={["Access (Art. 15)","Rectification (Art. 16)","Erasure (Art. 17)","Restriction (Art. 18)","Portability (Art. 20)","Objection (Art. 21)"]} /> },
      { id: "dpo", title: "3. Data Protection Officer", body: <P>dpo@novasafe.app · NovaSafe EU-Rep GmbH, Friedrichstraße 68, 10117 Berlin, Germany.</P> },
      { id: "transfers", title: "4. International transfers", body: <P>EU customer data stays in EU regions by default. Where transfers occur, we rely on Standard Contractual Clauses and supplementary technical measures.</P> },
    ]} />
);
