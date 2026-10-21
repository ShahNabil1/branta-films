import { SiteShell } from "@/components/site/SiteShell";
import { Eyebrow, SiteContainer } from "@/components/layout/primitives";

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
      <section className="hero-glow relative isolate overflow-hidden pb-[var(--section-y)] pt-20 md:pt-28">
        <SiteContainer>
          <Eyebrow className="mb-8">Legal</Eyebrow>
          <h1 className="text-display-xl max-w-[14ch]">{title}</h1>
          <p className="text-body-lg mt-8 max-w-xl text-muted-foreground">{intro}</p>
          <p className="text-caption mt-8 font-mono text-muted-foreground">Last updated: {updated}</p>
        </SiteContainer>
      </section>
      <section className="light bg-background py-[var(--section-y)]">
        <SiteContainer className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow>Branta Films · Branta Tech</Eyebrow>
          </div>
          <div className="grid gap-10 lg:col-span-8">
            {sections.map(([heading, copy]) => (
              <section key={heading} className="border-b border-border pb-10 last:border-0 last:pb-0">
                <h2 className="text-h3">{heading}</h2>
                <p className="text-body mt-4 max-w-3xl text-muted-foreground">{copy}</p>
              </section>
            ))}
            <section>
              <h2 className="text-h3">Contact</h2>
              <p className="text-body mt-4 text-muted-foreground">
                Questions can be sent to{" "}
                <a
                  className="font-medium text-foreground underline decoration-border underline-offset-[6px] hover:decoration-primary"
                  href="mailto:hello@brantatech.com"
                >
                  hello@brantatech.com
                </a>
                .
              </p>
            </section>
          </div>
        </SiteContainer>
      </section>
    </SiteShell>
  );
}
