import { useSuspenseQuery as useSQ } from "@tanstack/react-query";
import { programsQuery } from "@/lib/content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AccountShell, Panel } from "@/components/site/AccountShell";
import { ProgramCard } from "@/components/site/ProgramCard";
import { Button } from "@/components/ui/button";
import { accountQuery } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/minha-lista")({
  head: () => ({ meta: [{ title: "Minha lista — TV Lebara" }, { name: "description", content: "Conteúdos salvos para assistir depois." }, { property: "og:title", content: "Minha lista — TV Lebara" }, { property: "og:description", content: "Conteúdos salvos." }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(programsQuery); return context.queryClient.ensureQueryData(accountQuery); },
  component: MyList,
});

function MyList() {
  const { data: programs } = useSQ(programsQuery);
  const { data } = useSuspenseQuery(accountQuery);
  const list = programs.filter((p) => data.favorites.includes(p.slug));
  return (
    <AccountShell title="Minha lista" subtitle="Os conteúdos que você guardou para assistir depois.">
      {list.length === 0 ? (
        <Panel className="text-center">
          <p className="font-display text-xl font-bold">Sua lista está vazia</p>
          <p className="mt-2 text-muted-foreground">Abra um programa e toque em "Adicionar à lista".</p>
          <Button asChild className="mt-5 rounded-full"><Link to="/assistir">Explorar conteúdos</Link></Button>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <Link key={p.slug} to="/assistir/$slug" params={{ slug: p.slug }}><ProgramCard p={p} /></Link>)}
        </div>
      )}
    </AccountShell>
  );
}
