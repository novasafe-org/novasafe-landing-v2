const stats = [
  { v: "256-bit", l: "AES + XChaCha20 encryption" },
  { v: "0", l: "plaintext bytes ever stored" },
  { v: "<40ms", l: "vault unlock on device" },
  { v: "99.99%", l: "uptime SLA" },
];

export const Stats = () => (
  <section className="relative border-y border-border/60 bg-surface-1/40 py-16">
    <div className="container">
      <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center sm:text-left">
            <div className="text-gradient-primary text-[44px] font-semibold leading-none tracking-tightest sm:text-[52px]">
              {s.v}
            </div>
            <div className="mt-2 text-[13px] font-medium text-ink-soft">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);