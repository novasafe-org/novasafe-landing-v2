import { ProductHuntTopStrip } from "@/components/landing/ProductHuntBanner";
import { SiteHeader } from "./SiteHeader";

/** Scrollable Product Hunt strip + sticky site navigation. */
export function SiteChrome() {
  return (
    <>
      <ProductHuntTopStrip />
      <SiteHeader />
    </>
  );
}
