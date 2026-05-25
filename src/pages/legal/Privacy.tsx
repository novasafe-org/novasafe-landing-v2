import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L } from "./_sections";

export default () => (
  <LegalLayout
    title="Privacy Policy"
    updated="May 1, 2026"
    intro="NovaSafe is built so we can know as little about you as mathematically possible. This policy explains what we collect, why, and how you can control it."
    sections={[
      { id: "overview", title: "1. Overview", body: <P>We provide a zero-knowledge encrypted vault. Your vault contents are encrypted on your device with keys we never receive. This means we cannot read, recover, sell, or surrender your data — even if compelled.</P> },
      { id: "data", title: "2. What we collect", body: <><P>To run the service we collect:</P><L items={["Account metadata: email, billing region, organization name","Operational telemetry: device type, OS version, app version","Aggregate usage metrics: feature use, error counts (no content)","Encrypted vault payloads (opaque ciphertext — we cannot read these)"]} /></> },
      { id: "do-not", title: "3. What we never collect", body: <L items={["Your master password","Decrypted vault items, passwords, secrets, notes, files","Browsing history or autofill events","Biometric data","Behavioral profiles for advertising"]} /> },
      { id: "use", title: "4. How we use information", body: <P>Operational data is used solely to deliver, secure, and improve NovaSafe. We do not sell personal information. We do not run advertising of any kind.</P> },
      { id: "sub", title: "5. Sub-processors", body: <P>A current list of sub-processors is published at /compliance. We notify customers at least 30 days before adding any new sub-processor.</P> },
      { id: "rights", title: "6. Your rights", body: <P>Under GDPR, CCPA, and similar laws you may request access, correction, export, or deletion of personal data we hold. Contact privacy@novasafe.app.</P> },
      { id: "retention", title: "7. Retention", body: <P>Account data is retained while your account is active. On deletion, all data is purged within 30 days. Backups are rotated within 90 days.</P> },
      { id: "contact", title: "8. Contact", body: <P>privacy@novasafe.app · NovaSafe Technologies Pvt. Ltd., Bangalore, India · EU representative: EU-Rep GmbH, Berlin, Germany.</P> },
    ]}
  />
);
