import { LegalLayout } from "@/components/site/LegalLayout";
import { P } from "./_sections";
export default () => (
  <LegalLayout title="Data Processing Agreement" updated="March 14, 2026" intro="Our standard DPA incorporates the EU Standard Contractual Clauses and the UK IDTA. Customers can execute the DPA via our self-serve portal or request a custom MSA."
    sections={[
      { id: "scope", title: "1. Scope", body: <P>Applies to all NovaSafe customers who process personal data subject to GDPR, UK GDPR, or equivalent regimes.</P> },
      { id: "roles", title: "2. Roles", body: <P>For vault contents, NovaSafe acts as a processor. For account metadata, NovaSafe acts as a joint controller for limited purposes detailed in Annex II.</P> },
      { id: "transfers", title: "3. International transfers", body: <P>EU data is stored in eu-west-1 and eu-central-1 by default. Cross-border transfers occur only with SCCs in place and supplementary measures as required by Schrems II.</P> },
      { id: "breach", title: "4. Breach notification", body: <P>NovaSafe will notify the customer within 24 hours of confirming a personal data breach affecting their data.</P> },
    ]} />
);
