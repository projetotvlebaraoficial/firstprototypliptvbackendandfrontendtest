import { useSuspenseQuery as useSQ } from "@tanstack/react-query";
import { programsQuery } from "@/lib/content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PageIntro } from "@/components/site/PageShell";
import { categories } from "@/lib/site";
import { ProgramCard } from "@/components/site/ProgramCard";
import { cn } from "@/lib/utils";

type Search = { categoria?: string | undefined };

export const Route = createFileRoute("/conteudos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    categoria: typeof s["categoria"] === "string" ? s["categoria"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Conteúdos — TV Lebara" },
      { name: "description", content: "Entrevistas, palestras, podcasts e programas sobre Umbanda, Candomblé, Quimbanda, Ìfá, Jurema Sagrada e cultura afro-brasileira." },
      { property: "og:title", content: "Conteúdos da TV Lebara" },
      { property: "og:description", content: "Descubra os conteúdos da TV Lebara por categoria." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(programsQuery),
  component: Conteudos,
});

function Conteudos() {
  const { data: programs } = useSQ(programsQuery);
  const { categoria } = Route.useSearch();
  const current = categories.find((c) => c.slug === categoria);
  const list = current ? programs.filter((p) => p.category === current.name) : programs;
  return (
    <>
      <PageIntro eyebrow="Catálogo" title="Conteúdos">Escolha um caminho e descubra o que já está disponível.</PageIntro>
      <section className="container-page py-14">
        <div className="mb-10 flex flex-wrap gap-2" role="list">
          <Link to="/conteudos" className={cn("rounded-full border px-4 py-2 font-medium transition-colors", !current ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/40")}>Todos</Link>
          {categories.map((c) => (
            <Link key={c.slug} to="/conteudos" search={{ categoria: c.slug }} className={cn("rounded-full border px-4 py-2 font-medium transition-colors", current?.slug === c.slug ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/40")}>
              {c.name}
            </Link>
          ))}
        </div>
        {list.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map((p) => <ProgramCard key={p.slug} p={p} />)}</div>
        ) : (
          <EmptyState title={`Ainda não há conteúdos em ${current?.name ?? "esta categoria"}`}>
            Novos conteúdos estão em produção. Volte em breve.
          </EmptyState>
        )}
      </section>
    </>
  );
}
