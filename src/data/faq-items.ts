import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Building2,
  Fingerprint,
  KeyRound,
  Lock,
  Shield,
  ShieldCheck,
  Smartphone,
  Vault,
} from "lucide-react";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  icon: LucideIcon;
};

/** Canonical FAQ content — shared across landing, pricing, and other marketing pages. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "difference",
    question: "How is NovaSafe different from a password manager?",
    answer:
      "NovaSafe is more than a password manager. It helps protect passwords, passkeys, authenticator codes, secure notes, payment cards, SSH keys, recovery codes and other sensitive information inside one encrypted vault.",
    icon: KeyRound,
  },
  {
    id: "visibility",
    question: "Can NovaSafe see my passwords?",
    answer:
      "No. NovaSafe uses a zero-knowledge security architecture. Your data is encrypted before it leaves your device, which means NovaSafe cannot access or read your passwords, secure notes or secrets.",
    icon: Lock,
  },
  {
    id: "store",
    question: "What can I store in NovaSafe?",
    answer:
      "You can securely store passwords, passkeys, authenticator codes, secure notes, payment cards, SSH keys, API credentials, recovery codes and other sensitive information in your secure vault.",
    icon: Vault,
  },
  {
    id: "passkeys",
    question: "Does NovaSafe support passkeys?",
    answer:
      "Yes. NovaSafe works as a passkey manager, allowing you to sign in to supported websites and applications with modern passwordless authentication instead of traditional passwords.",
    icon: Fingerprint,
  },
  {
    id: "authenticator",
    question: "Does NovaSafe include an authenticator?",
    answer:
      "Yes. NovaSafe can generate time-based one-time passwords (TOTP) for two-factor authentication, helping you secure your online accounts with built-in authenticator support.",
    icon: ShieldCheck,
  },
  {
    id: "devices",
    question: "Can I use NovaSafe on multiple devices?",
    answer:
      "Yes. Your encrypted vault securely syncs across your devices so you can access passwords, passkeys and secure notes wherever you work.",
    icon: Smartphone,
  },
  {
    id: "breach",
    question: "What happens if NovaSafe servers are compromised?",
    answer:
      "Because your vault is encrypted before it leaves your device, attackers would only obtain encrypted data that cannot be read without your credentials. Your password security stays intact.",
    icon: Shield,
  },
  {
    id: "mobile",
    question: "Is NovaSafe available on mobile devices?",
    answer:
      "Yes. NovaSafe is designed to work across web, browser extensions and mobile devices, with desktop applications planned for future releases.",
    icon: Smartphone,
  },
  {
    id: "import",
    question: "Can I import passwords from other password managers?",
    answer:
      "Yes. NovaSafe supports importing credentials from popular password managers, making migration to your new secure vault simple and secure.",
    icon: ArrowRightLeft,
  },
  {
    id: "business",
    question: "Is NovaSafe built for businesses?",
    answer:
      "NovaSafe currently focuses on personal identity security. Enterprise capabilities, team management and business security features are planned for future releases.",
    icon: Building2,
  },
];
