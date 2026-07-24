import { useEffect } from "react";
import { PageShell } from "@/components/site/PageShell";
import { PasswordGenerator } from "@/components/resources/PasswordGenerator";

const PAGE_TITLE = "Strong Password Generator — NovaSafe";
const PAGE_DESCRIPTION =
  "Generate strong, random passwords instantly with NovaSafe's secure online password generator. Everything runs in your browser — no tracking, no storage, zero knowledge.";

export default function PasswordGeneratorPage() {
  useEffect(() => {
    document.title = PAGE_TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", PAGE_DESCRIPTION);
    return () => {
      document.title = "NovaSafe — Zero-Knowledge Encrypted Vault for People & Teams";
      if (meta) {
        meta.setAttribute(
          "content",
          "NovaSafe is a zero-knowledge vault for passwords, secrets and sensitive data. End-to-end encrypted on your device — only you hold the keys.",
        );
      }
    };
  }, []);

  return (
    <PageShell>
      <PasswordGenerator />
    </PageShell>
  );
}
