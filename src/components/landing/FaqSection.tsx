import { motion } from "framer-motion";

import { FaqContent } from "@/components/shared/FaqContent";

export function FaqSection() {
  return (
    <section id="faq" className="relative bg-background py-24 sm:py-32" aria-labelledby="faq-heading">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <FaqContent showCta headingId="faq-heading" />
        </motion.div>
      </div>
    </section>
  );
}

export default FaqSection;
