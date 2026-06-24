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

import PasswordManager from "./pages/features/PasswordManager";
import Passkeys from "./pages/features/Passkeys";
import SecureSharing from "./pages/features/SecureSharing";

import DevApi from "./pages/developers/Api";
import DevCli from "./pages/developers/Cli";
import Changelog from "./pages/developers/Changelog";
import Status from "./pages/developers/Status";
import IncidentDetailPage from "./pages/status/IncidentDetailPage";

import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import SecurityPolicyPage from "./pages/legal/SecurityPolicy";
import Cookies from "./pages/legal/Cookies";
import ResponsibleDisclosure from "./pages/legal/ResponsibleDisclosure";

import About from "./pages/company/About";
import Contact from "./pages/company/Contact";
import Blog from "./pages/company/Blog";
import BlogPostPage from "./pages/company/BlogPost";

import Help from "./pages/support/Help";

import DocsIndex from "./pages/docs/Index";
import GettingStarted from "./pages/docs/GettingStarted";
import Migration from "./pages/docs/Migration";

import SitemapPage from "./pages/Sitemap";
import DemoPage from "./pages/DemoPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/demo" element={<DemoPage />} />

          {/* Marketing */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/security" element={<Security />} />
          <Route path="/features" element={<FeaturesPage />} />

          {/* Feature subpages */}
          <Route path="/features/password-manager" element={<PasswordManager />} />
          <Route path="/features/passkeys" element={<Passkeys />} />
          <Route path="/features/secure-sharing" element={<SecureSharing />} />

          {/* Developers */}
          <Route path="/developers/api" element={<DevApi />} />
          <Route path="/developers/cli" element={<DevCli />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/status" element={<Status />} />
          <Route path="/status/incidents/:slug" element={<IncidentDetailPage />} />

          {/* Legal */}
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/security" element={<SecurityPolicyPage />} />
          <Route path="/legal/cookies" element={<Cookies />} />
          <Route path="/legal/responsible-disclosure" element={<ResponsibleDisclosure />} />

          {/* Company */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* Support */}
          <Route path="/help" element={<Help />} />

          {/* Docs */}
          <Route path="/docs" element={<DocsIndex />} />
          <Route path="/docs/getting-started" element={<GettingStarted />} />
          <Route path="/docs/migration" element={<Migration />} />

          <Route path="/sitemap" element={<SitemapPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
