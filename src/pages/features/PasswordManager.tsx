import { Key, Sparkles, ShieldCheck, Globe, Smartphone, Wand2 } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Password manager"
  title={<>Every credential, <span className="text-gradient-primary">sealed and instant.</span></>}
  lede="Generate, store, autofill, and rotate passwords across every browser and every device — without a single one ever leaving your encrypted vault unsealed."
  benefits={[
    { icon: Key, title: "Unlimited passwords", desc: "No item caps. Ever." },
    { icon: Wand2, title: "Smart autofill", desc: "Detects forms accurately, even on adversarial pages." },
    { icon: Sparkles, title: "Generator + strength", desc: "Customizable, pronounceable, or maximum entropy." },
    { icon: ShieldCheck, title: "Weak & reused alerts", desc: "Calm surfacing of risks. No nagging." },
    { icon: Globe, title: "Browser extensions", desc: "Chrome, Safari, Firefox, Edge, Arc, Brave." },
    { icon: Smartphone, title: "Native autofill", desc: "Deep iOS / Android integration. No clipboard leaks." },
  ]}
/>;
