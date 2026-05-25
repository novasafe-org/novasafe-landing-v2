import { LegalLayout } from "@/components/site/LegalLayout";
import { P } from "./_sections";

export default () => (
  <LegalLayout
    title="Terms of Service"
    updated="May 1, 2026"
    intro="By creating a NovaSafe account you agree to these terms. They're written to be readable, not to confuse you."
    sections={[
      { id: "service", title: "1. The service", body: <P>NovaSafe provides encrypted vaults for credentials, secrets, and sensitive data. The service is provided on a subscription basis as described at /pricing.</P> },
      { id: "account", title: "2. Your account", body: <P>You're responsible for keeping your master password and recovery materials safe. Because we use zero-knowledge encryption, we cannot recover your data if you lose them.</P> },
      { id: "acceptable", title: "3. Acceptable use", body: <P>Don't use NovaSafe to host illegal content, distribute malware, or attack our infrastructure. We may suspend accounts that violate these rules.</P> },
      { id: "payments", title: "4. Payments & refunds", body: <P>Yearly subscriptions are refundable within 30 days. Monthly subscriptions are billed in advance and non-refundable. See /pricing for full details.</P> },
      { id: "warranties", title: "5. Warranties", body: <P>We provide the service "as is" with the warranties stated in our Master Service Agreement (enterprise customers) or here for self-serve users.</P> },
      { id: "liability", title: "6. Liability", body: <P>To the maximum extent permitted by law, our liability for any claim arising out of the service is limited to amounts paid in the prior 12 months.</P> },
      { id: "law", title: "7. Governing law", body: <P>These terms are governed by the laws of Karnataka, India for individuals; Delaware, USA for US business customers; and Ireland for EU business customers.</P> },
    ]}
  />
);
