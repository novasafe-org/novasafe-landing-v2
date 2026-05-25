import { Building2, Users, ShieldCheck, GitBranch, Activity, FileCheck } from "lucide-react";
import { FeaturePage } from "./_template";

export default () => <FeaturePage
  eyebrow="Business vaults"
  title={<>Organization-wide vaults, <span className="text-gradient-primary">without the chaos.</span></>}
  lede="Spin up vaults per department, project, or environment. Map them to your org chart. Audit every access. All under one zero-knowledge umbrella."
  benefits={[
    { icon: Building2, title: "Hierarchical orgs", desc: "Companies → departments → teams → projects." },
    { icon: Users, title: "Granular roles", desc: "Built-in + custom roles with field-level scoping." },
    { icon: ShieldCheck, title: "Policy engine", desc: "Enforce MFA, session length, export restrictions." },
    { icon: GitBranch, title: "Vault templates", desc: "Provision standard vaults for new projects in seconds." },
    { icon: Activity, title: "Full audit trail", desc: "Every access logged and exportable." },
    { icon: FileCheck, title: "Compliance reports", desc: "One-click SOC 2 / ISO evidence exports." },
  ]}
/>;
