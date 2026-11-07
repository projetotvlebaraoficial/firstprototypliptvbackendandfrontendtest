import { useSuspenseQuery as useSQ } from "@tanstack/react-query";
import { newsQuery, programsQuery } from "@/lib/content";
import { NewsCard } from "@/components/site/NewsCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PlayCircle, CreditCard, Heart, Tv } from "lucide-react";
import { AccountShell, Panel } from "@/components/site/AccountShell";
import { AccountTrialCard } from "@/components/site/AccountTrialCard";
import { OfficialAccountCard } from "@/components/site/OfficialAccountCard";
import { ProgramCard } from "@/components/site/ProgramCard";
import { Button } from "@/components/ui/button";
import { accountQuery, tierOf, tvCount, userLabel } from "@/lib/account";
import { formatBRL } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — TV Lebara" },
      { name: "description", content: "Painel do assinante TV Lebara." },
      { property: "og:title", content: "Minha conta — TV Lebara" },
      { property: "og:description", content: "Painel do assinante TV Lebara." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(programsQuery),
      context.queryClient.ensureQueryData(newsQuery(3)),
    ]);
    return context.queryClient.ensureQueryData(accountQuery);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: programs } = useSQ(programsQuery);
  const { data } = useSuspenseQuery(accountQuery);
  const { data: news } = useSuspenseQuery(newsQuery(3));
  const sub = data.subscription;
  const active = sub?.status === "ativa";
  return (
    <AccountShell
      title="Painel do assinante"
      subtitle="Acompanhe sua assinatura e continue assistindo."
    >
      {!active && (
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-primary p-7 text-primary-foreground shadow-glow md:p-9">
          <p className="text-sm font-semibold opacity-80">Falta pouco!</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold md:text-3xl">
            Ative sua assinatura para liberar todos os conteúdos
          </h2>
          <p className="mt-2 opacity-85">
            Premium (1 TV) a partir de {formatBRL(3000)}/mês ou Premium Plus (até 3 TVs) a partir de{" "}
            {formatBRL(6000)}/mês. Também trimestral, semestral e anual.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-5 rounded-full">
            <Link to="/assinar">Assinar agora</Link>
          </Button>
        </div>
      )}
      <OfficialAccountCard />
      <AccountTrialCard />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel>
          <CreditCard className="h-6 w-6 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Assinatura</p>
          <p className="font-display text-xl font-bold">{userLabel(sub)}</p>
          <p
            className={`mt-1 text-sm font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            {active ? "IPTV Ativo" : "IPTV Indisponível"}
          </p>
        </Panel>
        <Panel>
          <PlayCircle className="h-6 w-6 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Próxima renovação</p>
          <p className="font-display text-xl font-bold">
            {sub?.current_period_end
              ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
              : "—"}
          </p>
        </Panel>
        <Panel>
          <Heart className="h-6 w-6 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Na minha lista</p>
          <p className="font-display text-xl font-bold">{data.favorites.length} conteúdo(s)</p>
        </Panel>
      </div>
      <Panel className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Tv className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="font-display text-xl font-bold">
                Assista na sua TV com IPTV
                {active && (
                  <>
                    {" "}
                    - Disponível para:{" "}
                    <span className="ml-1 inline-flex items-center rounded-lg bg-primary px-2.5 py-0.5 font-extrabold text-primary-foreground shadow-glow">
                      {tvCount(sub)}
                    </span>
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {active
                  ? tierOf(sub) === "premium_plus"
                    ? "Seu Premium Plus libera a TV Lebara em até 3 TVs, além da live e dos conteúdos gravados no site."
                    : "Seu Premium libera a TV Lebara em 1 TV, além da live e dos conteúdos gravados no site. Quer mais telas? O Premium Plus libera até 3 TVs."
                  : "Premium: 1 TV · Premium Plus: até 3 TVs. Assine para assistir direto na televisão por um aplicativo de IPTV."}
              </p>
              {active && tierOf(sub) === "premium" && (
                <Link
                  to="/assinar"
                  search={{ plano: "premium_plus" }}
                  className="mt-2 inline-block text-sm font-semibold text-primary"
                >
                  Mudar para Premium Plus (3 TVs) →
                </Link>
              )}
            </div>
          </div>
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {active ? "IPTV Ativo" : "IPTV Indisponível"}
          </span>
        </div>
      </Panel>
      <h2 className="mt-10 font-display text-2xl font-bold">Destaques para você</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {programs.slice(0, 3).map((p) => (
          <Link key={p.slug} to="/assistir/$slug" params={{ slug: p.slug }}>
            <ProgramCard p={p} />
          </Link>
        ))}
      </div>
      {news.length > 0 && (
        <>
          <div className="mt-10 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold">Notícias e Novidades</h2>
            <Link to="/noticias" className="text-sm font-semibold text-primary">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {news.map((n) => (
              <NewsCard key={n.id} n={n} />
            ))}
          </div>
        </>
      )}
    </AccountShell>
  );
}
