import { Fingerprint, ShieldCheck, Globe, KeyRound, Cpu, Zap } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Passkeys"
  title={<>Sign in without a <span className="text-gradient-primary">password to phish.</span></>}
  lede="Passkeys replace passwords with hardware-bound public-key cryptography. NovaSafe stores them, syncs them, and shares them — phishing-resistant by design."
  benefits={[
    { icon: Fingerprint, title: "Biometric unlock", desc: "Face ID, Touch ID, Windows Hello, Android biometrics." },
    { icon: ShieldCheck, title: "Phishing resistant", desc: "Cryptographically bound to the origin domain." },
    { icon: KeyRound, title: "WebAuthn standard", desc: "FIDO2 compliant. Works with Apple, Google, Microsoft." },
    { icon: Cpu, title: "Hardware-bound", desc: "Secure Enclave, TPM 2.0, Android Keystore." },
    { icon: Globe, title: "Cross-device sync", desc: "Encrypted passkey sync across every NovaSafe device." },
    { icon: Zap, title: "One-tap sign in", desc: "No code to type. No SMS to wait for." },
  ]}
  deepDiveTitle="Why passkeys win"
  deepDiveLede="Passwords are guessable, reusable, and phishable. Passkeys aren't."
  deepDivePoints={[
    "Public key sent to the service; private key never leaves your device",
    "Origin-bound — can't be tricked into signing for a lookalike domain",
    "No shared secret to leak in a breach",
    "Works offline; nothing to phish over email or SMS",
  ]}
/>;
