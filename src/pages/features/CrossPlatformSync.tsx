import { Smartphone, Monitor, Globe, Wifi, RefreshCw, ShieldCheck } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Cross-platform sync"
  title={<>Every device, <span className="text-gradient-primary">in perfect step.</span></>}
  lede="Native apps for every platform you use, kept in sync over an encrypted channel. Your changes appear everywhere in under a second — even offline."
  benefits={[
    { icon: Monitor, title: "Native desktop", desc: "macOS, Windows, Linux — built with platform-native frameworks." },
    { icon: Smartphone, title: "Native mobile", desc: "iOS & Android, with system-level autofill." },
    { icon: Globe, title: "Web vault", desc: "Full-fidelity web app for any browser." },
    { icon: Wifi, title: "Offline first", desc: "Everything works offline. Sync resumes automatically." },
    { icon: RefreshCw, title: "Conflict-free sync", desc: "CRDT-based merging. No lost edits, ever." },
    { icon: ShieldCheck, title: "End-to-end encrypted", desc: "Sync happens over ciphertext. Server sees nothing." },
  ]}
/>;
