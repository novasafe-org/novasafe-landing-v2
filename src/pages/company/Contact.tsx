import { useState } from "react";

import { PageShell } from "@/components/site/PageShell";
import { ContactHero } from "@/components/contact/ContactHero";
import { CategoryPicker } from "@/components/contact/CategoryPicker";
import { ContactFormPanel } from "@/components/contact/ContactFormPanel";
import { TrustStrip } from "@/components/contact/TrustStrip";
import { EmailCards } from "@/components/contact/EmailCards";
import type { ContactCategory } from "@/lib/contactApi";

export default function Contact() {
  const [category, setCategory] = useState<ContactCategory | "">("");

  return (
    <PageShell>
      <ContactHero />

      <section className="pb-16 sm:pb-24">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,35%)_minmax(0,65%)] lg:gap-10">
              <CategoryPicker selected={category} onSelect={setCategory} />
              <div>
                <ContactFormPanel category={category} onCategoryChange={setCategory} />
                <TrustStrip />
              </div>
            </div>

            <EmailCards />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
