import { LegalLayout } from "@/components/site/LegalLayout";
import { P } from "./_sections";
export default () => (
  <LegalLayout title="SOC 2" updated="February 1, 2026" intro="NovaSafe maintains a SOC 2 Type II report covering Security, Availability, and Confidentiality."
    sections={[
      { id: "scope", title: "1. Report scope", body: <P>The report covers the NovaSafe platform, infrastructure, employees, and operational processes across all production regions. Audit period: January 1 – December 31, 2025.</P> },
      { id: "auditor", title: "2. Auditor", body: <P>Performed by EY (Ernst & Young) under AICPA SSAE 18 standards.</P> },
      { id: "request", title: "3. Requesting the report", body: <P>The full report is available to customers and prospects under NDA. Email security@novasafe.app or request via your account dashboard.</P> },
    ]} />
);
