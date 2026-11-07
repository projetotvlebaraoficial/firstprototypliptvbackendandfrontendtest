import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <section className="px-3 pt-24 md:px-5 md:pt-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-ink-foreground md:px-14 md:py-20">
      <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
      <div className="relative max-w-3xl animate-rise">
        {eyebrow && <p className="eyebrow mb-3 !text-primary-glow">{eyebrow}</p>}
        <h1 className="text-4xl font-extrabold md:text-5xl">{title}</h1>
        {children && <div className="mt-4 text-lg text-ink-foreground/75">{children}</div>}
      </div>
      </div>
    </section>
  );
}

export function LegalDoc({ title, version, updated, children }: { title: string; version: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageIntro eyebrow="Documento legal" title={title}>
        <p className="text-base">Versão {version} · Vigente a partir de {updated} · Última atualização: {updated}</p>
      </PageIntro>
      <article className="container-page legal-prose max-w-3xl py-14">{children}</article>
    </>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gradient-primary" />
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{children}</p>
    </div>
  );
}
