import { ScanLine, ShieldCheck, Cloud, Smartphone, Copy, Clock } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Authenticator"
  title={<>One-time codes, <span className="text-gradient-primary">end-to-end encrypted.</span></>}
  lede="The convenience of Google Authenticator, with the trust of NovaSafe encryption. Your OTP seeds are sealed — never stored in plaintext on any server."
  benefits={[
    { icon: ScanLine, title: "TOTP & HOTP", desc: "RFC 6238 / 4226 compatible. Works with every service." },
    { icon: Cloud, title: "Encrypted backup", desc: "Switch phones without losing a single seed." },
    { icon: Smartphone, title: "Mobile + desktop", desc: "Codes everywhere you sign in." },
    { icon: Copy, title: "Inline autofill", desc: "Codes appear next to login forms automatically." },
    { icon: Clock, title: "Drift correction", desc: "Auto-syncs with NTP. No more 'invalid code'." },
    { icon: ShieldCheck, title: "Hardware-key fallback", desc: "Pair with YubiKey or Titan as a backup factor." },
  ]}
/>;
