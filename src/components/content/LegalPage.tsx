import { SiteShell } from "@/components/site/SiteShell";

export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: readonly (readonly [string, string])[];
}) {
  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-[clamp(1.25rem,4vw,3rem)] py-20 md:py-28">
          <p className="text-eyebrow text-primary">Legal</p>
          <h1 className="mt-6 max-w-[16ch] text-h1">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{intro}</p>
          <p className="mt-8 font-mono text-xs text-muted-foreground">Last updated: {updated}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-12 px-[clamp(1.25rem,4vw,3rem)] py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <p className="text-eyebrow text-muted-foreground">Branta Films · Branta Tech</p>
        <div className="grid gap-10">
          {sections.map(([heading, copy]) => (
            <section key={heading} className="border-b border-border pb-10 last:border-0 last:pb-0">
              <h2 className="text-h3">{heading}</h2>
              <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{copy}</p>
            </section>
          ))}
          <section>
            <h2 className="text-h3">Contact</h2>
            <p className="mt-4 text-muted-foreground">
              Questions can be sent to{" "}
              <a className="font-medium text-foreground underline decoration-primary underline-offset-4" href="mailto:hello@brantatech.com">
                hello@brantatech.com
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </SiteShell>
  );
}
