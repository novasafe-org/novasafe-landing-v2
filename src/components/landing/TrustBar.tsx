const logos = ["ATLAS", "VANTA", "NORTHWIND", "OBSIDIAN", "HELIOS", "QUANTLY", "ORBIT", "SENTRA"];

export const TrustBar = () => {
  return (
    <section className="relative border-y border-border/60 bg-surface-1/60 py-10">
      <div className="container">
        <p className="text-center text-[11.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by security-first teams across 40+ countries
        </p>
        <div className="relative mt-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
          <div className="flex w-max animate-marquee gap-14">
            {[...logos, ...logos].map((l, i) => (
              <span
                key={i}
                className="select-none whitespace-nowrap text-[20px] font-bold tracking-widest text-ink/40 transition-colors hover:text-ink/70"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};