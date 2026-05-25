import { ShieldCheck, Key, Cpu, Eye, Lock, FileCheck } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Zero-knowledge architecture"
  title={<>The only person <span className="text-gradient-primary">who can read your vault — is you.</span></>}
  lede="Zero-knowledge isn't marketing language. It's a mathematical guarantee: NovaSafe servers physically cannot decrypt your data, even if compelled to."
  benefits={[
    { icon: Key, title: "Client-side keys", desc: "Master key derived on-device with Argon2id. Never transmitted." },
    { icon: Lock, title: "Sealed payloads", desc: "AES-256-GCM authenticated encryption per item." },
    { icon: Cpu, title: "Hardware-bound", desc: "Device keys bound to Secure Enclave / TPM where available." },
    { icon: Eye, title: "Subpoena-proof", desc: "We comply with law — and the law gets ciphertext." },
    { icon: ShieldCheck, title: "Verifiable clients", desc: "Reproducible builds; verify your app matches the source." },
    { icon: FileCheck, title: "Audited cryptography", desc: "Reviewed by Trail of Bits, Cure53, and NCC Group." },
  ]}
  deepDiveTitle="What 'zero-knowledge' really means"
  deepDivePoints={[
    "Encryption keys are derived from your master password locally",
    "Servers store opaque ciphertext, never plaintext",
    "Sharing is done via per-recipient X25519 key wrapping",
    "There is no master key, recovery escrow, or backdoor",
  ]}
/>;
