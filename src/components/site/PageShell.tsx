import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SiteChrome } from "./SiteChrome";
import { SiteFooter } from "./SiteFooter";

export const PageShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [pathname]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteChrome />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
};
