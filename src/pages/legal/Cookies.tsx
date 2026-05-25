import { LegalLayout } from "@/components/site/LegalLayout";
import { P } from "./_sections";
export default () => (
  <LegalLayout title="Cookie Policy" updated="February 28, 2026" intro="NovaSafe uses the minimum number of cookies required to operate. We do not use advertising or tracking cookies."
    sections={[
      { id: "what", title: "1. What we use", body: <P>Strictly necessary cookies for authentication and session management. Optional analytics cookies (off by default, EU) for aggregate product analytics — never identifying individuals.</P> },
      { id: "choice", title: "2. Your choice", body: <P>You can manage cookie preferences in the consent banner or in your browser settings. Disabling necessary cookies will prevent sign-in.</P> },
    ]} />
);
