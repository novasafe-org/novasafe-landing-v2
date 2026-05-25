import { Share2, Timer, Eye, Users, Link2, ShieldCheck } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Secure sharing"
  title={<>Send secrets, <span className="text-gradient-primary">not screenshots.</span></>}
  lede="Share passwords, API keys, files, or notes with end-to-end encryption. Set expiry, view limits, and revoke anytime — even after the link is sent."
  benefits={[
    { icon: Share2, title: "E2EE sharing", desc: "Recipients decrypt locally; server only sees ciphertext." },
    { icon: Timer, title: "Expiry & view limits", desc: "Self-destruct after first view or fixed timer." },
    { icon: Eye, title: "View receipts", desc: "Know when and where it was opened." },
    { icon: Link2, title: "Single-use links", desc: "Burn after read for sensitive handoffs." },
    { icon: Users, title: "Share with anyone", desc: "Recipients don't need a NovaSafe account." },
    { icon: ShieldCheck, title: "Revocable anytime", desc: "Pull access back in one click." },
  ]}
/>;
