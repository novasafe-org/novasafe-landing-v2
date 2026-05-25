import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L, H } from "./_sections";

export default () => (
  <LegalLayout
    title="Privacy Policy"
    updated="May 1, 2026"
    intro="NovaSafe is designed so we know as little about you as mathematically possible. This Privacy Policy describes the limited information we collect when you use NovaSafe, why we collect it, how it is used, and the rights you have over it. We have written it in plain language wherever possible, and kept the legal precision where it matters."
    sections={[
      { id: "overview", title: "Overview", body: <>
        <P>NovaSafe is a zero-knowledge encrypted vault. Your vault contents — passwords, passkeys, secure notes, and attachments — are encrypted on your device using keys derived from your master password. Those keys never leave your device and are never transmitted to NovaSafe.</P>
        <P>This means that, by design, we cannot read your vault. We cannot recover it for you if you lose your master password, we cannot sell it, and we cannot disclose its contents to a third party — including law enforcement — even if compelled, because we do not possess the keys required to decrypt it.</P>
        <P>This Privacy Policy applies to the NovaSafe applications (web, browser extensions, desktop and mobile apps), the marketing website at novasafe.app, and any related services we provide ("NovaSafe", "we", "us"). It does not apply to third-party websites or services that you may access using credentials stored in NovaSafe.</P>
      </> },
      { id: "collect", title: "Information we collect", body: <>
        <P>To operate NovaSafe reliably and securely, we collect a deliberately small amount of information. We have grouped it into three categories.</P>
        <H>Account information</H>
        <L items={[
          "Email address — used to identify your account, send security notifications, and recover access to your billing.",
          "Billing details — name, billing address, and the last four digits of your payment method. Full card details are handled by our payment processor and never stored on NovaSafe servers.",
          "Authentication metadata — a salted hash used to validate your sign-in, the salt and parameters required to derive your encryption keys client-side, and a list of devices you have authorized.",
        ]} />
        <H>Encrypted vault data</H>
        <P>We store the ciphertext of your vault on our servers so that it can sync across your devices. We can see that ciphertext exists, the date it was last modified, and roughly how large it is — we cannot see what it contains, what websites it relates to, or any of the values inside.</P>
        <H>Operational telemetry</H>
        <L items={[
          "Device type, operating system, and application version — used to deliver the right binaries and to diagnose compatibility issues.",
          "Crash reports and aggregated error counts — used to improve stability. We strip identifiers and free-form strings before they leave your device.",
          "Coarse usage metrics — for example, the number of accounts that used a feature in a week. These metrics are aggregated and cannot be tied back to an individual user.",
        ]} />
      </> },
      { id: "never", title: "Information we never collect", body: <>
        <P>The following information is never sent to NovaSafe servers, and we have no way to obtain it:</P>
        <L items={[
          "Your master password, biometric template, or any value derived from them in a reversible way.",
          "Decrypted vault items, including passwords, passkeys, secure notes, file attachments, addresses, or payment cards stored in your vault.",
          "Your browsing history, the URLs you visit, or the autofill events that occur in your browser.",
          "Behavioral profiles for advertising. NovaSafe does not run ads and does not participate in advertising networks.",
        ]} />
      </> },
      { id: "use", title: "How we use information", body: <>
        <P>We use the information described above only to provide, secure, and improve NovaSafe. Specifically, we use it to:</P>
        <L items={[
          "Authenticate you and synchronize your encrypted vault across your devices.",
          "Process payments, issue invoices, and prevent fraudulent transactions.",
          "Notify you about important security events on your account, such as new device sign-ins.",
          "Investigate suspected abuse, including credential stuffing, automated scraping, and platform misuse.",
          "Improve product quality through aggregated analytics and crash reports.",
        ]} />
        <P>We do not sell, rent, or otherwise share personal information for monetary or other valuable consideration. We do not use your information to train machine-learning models.</P>
      </> },
      { id: "legal", title: "Legal basis for processing", body: <>
        <P>If you are located in the European Economic Area, the United Kingdom, or another jurisdiction that requires us to identify a legal basis for processing personal data, we rely on the following bases:</P>
        <L items={[
          "Performance of a contract — to provide the service you have requested.",
          "Legitimate interests — to secure the service against abuse and to improve product quality.",
          "Compliance with a legal obligation — for tax, accounting, and lawful requests we are required to honor.",
          "Consent — for any optional communications, which you can withdraw at any time.",
        ]} />
      </> },
      { id: "sharing", title: "Sharing with third parties", body: <>
        <P>We share information only with vetted service providers ("sub-processors") who help us operate NovaSafe under written contracts that bind them to confidentiality and to the use of the data solely on our instructions. The current list of sub-processors covers our cloud infrastructure provider, payment processor, transactional email provider, and product analytics platform.</P>
        <P>We will disclose information when required to do so by a valid legal process. Because of our zero-knowledge architecture, the only data we can produce in response is the limited account and metadata described in this policy. We publish a transparency report annually summarising the requests we received.</P>
      </> },
      { id: "retention", title: "Data retention", body: <>
        <P>We retain account data for as long as your account is active. When you delete your account, we permanently delete your encrypted vault and account metadata from production systems within 30 days. Backups are encrypted, rotated, and fully purged within 90 days.</P>
        <P>Limited records — such as invoices and tax documents — are retained for the period required by applicable law, typically seven years.</P>
      </> },
      { id: "rights", title: "Your rights", body: <>
        <P>Depending on your location, you may have the right to access, correct, export, or delete the personal data we hold about you, to object to certain processing, and to lodge a complaint with a supervisory authority. You can exercise most of these rights directly from your account settings. For everything else, write to privacy@novasafe.app and we will respond within 30 days.</P>
        <P>If you are a California resident, you also have the right to know what categories of personal information we collect and to opt out of "sales" or "sharing" as those terms are defined under the CCPA. NovaSafe does not sell or share personal information for cross-context behavioral advertising.</P>
      </> },
      { id: "transfers", title: "International transfers", body: <P>NovaSafe operates primary infrastructure in the European Union and the United States. When personal data is transferred outside its origin region, the transfer is covered by Standard Contractual Clauses approved by the European Commission and equivalent safeguards in other jurisdictions.</P> },
      { id: "children", title: "Children", body: <P>NovaSafe is not directed to children under 13 (or 16 in the EEA), and we do not knowingly collect personal information from them. If you believe a child has provided us with personal information, please contact privacy@novasafe.app and we will delete it.</P> },
      { id: "changes", title: "Changes to this policy", body: <P>We may update this policy from time to time. When we make material changes, we will notify account holders by email and post a notice in the application at least 30 days before the changes take effect. Historical versions are archived and available on request.</P> },
      { id: "contact", title: "Contact us", body: <>
        <P>Questions about this policy or your data can be sent to privacy@novasafe.app. You can also reach us by post at NovaSafe Technologies, Inc., 548 Market Street, Suite 17000, San Francisco, CA 94104, United States.</P>
        <P>Our Data Protection Officer can be contacted at dpo@novasafe.app.</P>
      </> },
    ]}
  />
);
