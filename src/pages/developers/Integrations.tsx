import { DocsLayout } from "@/components/site/DocsLayout";
import { devNav } from "./_nav";

const groups: { t: string; items: string[] }[] = [
  { t: "Identity providers",  items: ["Okta","Azure AD / Entra","Google Workspace","JumpCloud","OneLogin","Ping Identity"] },
  { t: "Cloud platforms",     items: ["AWS","Google Cloud","Microsoft Azure","Vercel","Netlify","Cloudflare","Fly.io","Render"] },
  { t: "Source control",      items: ["GitHub","GitLab","Bitbucket","Gitea"] },
  { t: "CI/CD",               items: ["GitHub Actions","GitLab CI","CircleCI","Buildkite","Jenkins","Argo CD"] },
  { t: "Observability",       items: ["Datadog","Splunk","Elastic","New Relic","Grafana","PagerDuty"] },
  { t: "Communication",       items: ["Slack","Microsoft Teams","Discord","Linear","Jira","Notion"] },
];

export default () => (
  <DocsLayout nav={devNav} title="Integrations" lede="NovaSafe plugs into 120+ tools you already use. SCIM provisioning, SIEM streaming, secret injection — all first-party.">
    {groups.map((g) => (
      <div key={g.t}>
        <h2 className="text-[18px] font-semibold text-ink">{g.t}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {g.items.map((i) => (
            <span key={i} className="rounded-full border border-border bg-card/70 px-3 py-1 text-[12.5px] text-ink-soft">{i}</span>
          ))}
        </div>
      </div>
    ))}
  </DocsLayout>
);
