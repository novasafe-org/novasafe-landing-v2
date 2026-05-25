import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L } from "./_sections";

export default () => (
  <LegalLayout
    title="Terms of Service"
    updated="May 1, 2026"
    intro="These Terms of Service ('Terms') govern your access to and use of NovaSafe. By creating an account, downloading our applications, or otherwise using the service, you agree to be bound by these Terms. Please read them carefully — they describe what NovaSafe is, what you can expect from us, and what we expect from you."
    sections={[
      { id: "service", title: "The service", body: <>
        <P>NovaSafe provides encrypted vaults for credentials, passkeys, secure notes, and related sensitive data, together with the desktop, mobile, browser, and web applications used to access them (the "Service"). NovaSafe is operated by NovaSafe Technologies, Inc. ("NovaSafe", "we", "us").</P>
        <P>The Service is provided on a subscription basis. The features included in each plan, and the price for each plan, are described at novasafe.app/pricing. We may add, modify, or remove features over time; where a change is materially adverse to you, we will notify you in advance.</P>
      </> },
      { id: "eligibility", title: "Eligibility and accounts", body: <>
        <P>You must be at least 13 years old (or 16 in the European Economic Area) to use NovaSafe. By creating an account, you confirm that the information you provide is accurate and that you are authorized to agree to these Terms.</P>
        <P>You are responsible for the activity that occurs under your account, for keeping your master password and any recovery materials safe, and for promptly notifying us at security@novasafe.app of any suspected unauthorized access. Because NovaSafe uses zero-knowledge encryption, we cannot recover your vault if you lose your master password and recovery key.</P>
      </> },
      { id: "acceptable", title: "Acceptable use", body: <>
        <P>You agree not to use the Service to:</P>
        <L items={[
          "Store, distribute, or transmit content that is unlawful, infringing, or harmful to others.",
          "Distribute malware, conduct phishing, or engage in any activity intended to compromise the security of any system.",
          "Reverse engineer, decompile, or attempt to extract source code from the Service, except to the extent expressly permitted by applicable law.",
          "Attempt to circumvent rate limits, abuse usage quotas, or interfere with the integrity of the Service.",
          "Use the Service in violation of applicable export-control or sanctions laws.",
        ]} />
        <P>We may suspend or terminate accounts that violate these rules. Where the violation is not immediately harmful, we will attempt to contact you first.</P>
      </> },
      { id: "ip", title: "Your content and intellectual property", body: <>
        <P>You retain all rights to the data you store in NovaSafe. We do not claim ownership of your vault contents, and we cannot read them. You grant us a limited license to process your encrypted data solely as necessary to provide the Service.</P>
        <P>The Service itself, including all software, documentation, designs, and trademarks, is owned by NovaSafe and its licensors and is protected by intellectual property laws.</P>
      </> },
      { id: "billing", title: "Subscriptions, billing and refunds", body: <>
        <P>Paid subscriptions renew automatically at the end of each billing period until cancelled. You can cancel at any time from your account settings; cancellation takes effect at the end of the current billing period.</P>
        <P>Yearly subscriptions are fully refundable within 30 days of the initial charge. Monthly subscriptions are billed in advance and are non-refundable except as required by applicable law. Taxes, where applicable, are added at checkout.</P>
      </> },
      { id: "warranty", title: "Warranties and disclaimers", body: <>
        <P>We provide the Service with reasonable care and skill. To the maximum extent permitted by law, the Service is provided "as is" and "as available", without warranties of any kind, whether express, implied, statutory, or otherwise, including any warranties of merchantability, fitness for a particular purpose, and non-infringement.</P>
      </> },
      { id: "liability", title: "Limitation of liability", body: <>
        <P>To the maximum extent permitted by law, NovaSafe will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill. Our aggregate liability arising out of or relating to the Service is limited to the amounts paid by you to NovaSafe in the twelve months preceding the event giving rise to the claim.</P>
      </> },
      { id: "termination", title: "Termination", body: <P>You may terminate your account at any time from your account settings. We may terminate or suspend your access to the Service if you materially breach these Terms, if we are required to do so by law, or if continued provision of the Service becomes impractical. On termination, you may export your data for a period of 30 days, after which it is permanently deleted as described in our Privacy Policy.</P> },
      { id: "changes", title: "Changes to these Terms", body: <P>We may update these Terms from time to time. When we make material changes, we will notify you by email and post a notice in the application at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.</P> },
      { id: "law", title: "Governing law and disputes", body: <P>These Terms are governed by the laws of the State of Delaware, without regard to its conflict-of-laws principles. Any dispute will be resolved exclusively in the state or federal courts located in Wilmington, Delaware, except where mandatory consumer protection law in your jurisdiction provides otherwise.</P> },
      { id: "contact", title: "Contact", body: <P>Questions about these Terms can be sent to legal@novasafe.app or to NovaSafe Technologies, Inc., 548 Market Street, Suite 17000, San Francisco, CA 94104, United States.</P> },
    ]}
  />
);
