import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import Pricing from "./pages/marketing/Pricing";
import Security from "./pages/marketing/Security";
import FeaturesPage from "./pages/marketing/Features";
import Enterprise from "./pages/marketing/Enterprise";
import Teams from "./pages/marketing/Teams";
import Personal from "./pages/marketing/Personal";
import Compliance from "./pages/marketing/Compliance";

import PasswordManager from "./pages/features/PasswordManager";
import Passkeys from "./pages/features/Passkeys";
import SecureSharing from "./pages/features/SecureSharing";
import SecretsManagement from "./pages/features/SecretsManagement";
import Authenticator from "./pages/features/Authenticator";
import CrossPlatformSync from "./pages/features/CrossPlatformSync";
import ZeroKnowledge from "./pages/features/ZeroKnowledge";
import BusinessVaults from "./pages/features/BusinessVaults";

import DevOverview from "./pages/developers/Overview";
import DevApi from "./pages/developers/Api";
import DevSdks from "./pages/developers/Sdks";
import DevCli from "./pages/developers/Cli";
import DevWebhooks from "./pages/developers/Webhooks";
import DevIntegrations from "./pages/developers/Integrations";
import Changelog from "./pages/developers/Changelog";
import Status from "./pages/developers/Status";
import OpenSource from "./pages/developers/OpenSource";

import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import SecurityPolicyPage from "./pages/legal/SecurityPolicy";
import Cookies from "./pages/legal/Cookies";
import Dpa from "./pages/legal/Dpa";
import Gdpr from "./pages/legal/Gdpr";
import Soc2 from "./pages/legal/Soc2";
import ResponsibleDisclosure from "./pages/legal/ResponsibleDisclosure";
import VulnerabilityReporting from "./pages/legal/VulnerabilityReporting";

import About from "./pages/company/About";
import Careers from "./pages/company/Careers";
import Contact from "./pages/company/Contact";
import Press from "./pages/company/Press";
import Brand from "./pages/company/Brand";
import Blog from "./pages/company/Blog";
import Customers from "./pages/company/Customers";
import CaseStudies from "./pages/company/CaseStudies";

import Help from "./pages/support/Help";
import Faqs from "./pages/support/Faqs";
import AccountRecovery from "./pages/support/AccountRecovery";

import DocsIndex from "./pages/docs/Index";
import GettingStarted from "./pages/docs/GettingStarted";
import Migration from "./pages/docs/Migration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Marketing */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/security" element={<Security />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/compliance" element={<Compliance />} />

          {/* Feature subpages */}
          <Route path="/features/password-manager" element={<PasswordManager />} />
          <Route path="/features/passkeys" element={<Passkeys />} />
          <Route path="/features/secure-sharing" element={<SecureSharing />} />
          <Route path="/features/secrets-management" element={<SecretsManagement />} />
          <Route path="/features/authenticator" element={<Authenticator />} />
          <Route path="/features/cross-platform-sync" element={<CrossPlatformSync />} />
          <Route path="/features/zero-knowledge" element={<ZeroKnowledge />} />
          <Route path="/features/business-vaults" element={<BusinessVaults />} />

          {/* Developers */}
          <Route path="/developers" element={<DevOverview />} />
          <Route path="/developers/api" element={<DevApi />} />
          <Route path="/developers/sdks" element={<DevSdks />} />
          <Route path="/developers/cli" element={<DevCli />} />
          <Route path="/developers/webhooks" element={<DevWebhooks />} />
          <Route path="/developers/integrations" element={<DevIntegrations />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/status" element={<Status />} />
          <Route path="/open-source" element={<OpenSource />} />

          {/* Legal */}
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/security" element={<SecurityPolicyPage />} />
          <Route path="/legal/cookies" element={<Cookies />} />
          <Route path="/legal/dpa" element={<Dpa />} />
          <Route path="/legal/gdpr" element={<Gdpr />} />
          <Route path="/legal/soc2" element={<Soc2 />} />
          <Route path="/legal/responsible-disclosure" element={<ResponsibleDisclosure />} />
          <Route path="/legal/vulnerability-reporting" element={<VulnerabilityReporting />} />

          {/* Company */}
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/press" element={<Press />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/case-studies" element={<CaseStudies />} />

          {/* Support */}
          <Route path="/help" element={<Help />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/account-recovery" element={<AccountRecovery />} />

          {/* Docs */}
          <Route path="/docs" element={<DocsIndex />} />
          <Route path="/docs/getting-started" element={<GettingStarted />} />
          <Route path="/docs/migration" element={<Migration />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
