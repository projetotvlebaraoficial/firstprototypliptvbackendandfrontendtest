import { useSuspenseQuery as useSQ } from "@tanstack/react-query";
import { newsQuery, programsQuery } from "@/lib/content";
import { NewsCard } from "@/components/site/NewsCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Radio,
  PlayCircle,
  LayoutGrid,
  Lightbulb,
  MonitorSmartphone,
  RefreshCw,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/site/FaqList";
import { PlanCard } from "@/components/site/PlanCard";
import { StartOptions } from "@/components/site/StartOptions";
import { ProgramCard, StatusBadge, programImage } from "@/components/site/ProgramCard";
import { categories } from "@/lib/site";
import hero from "@/assets/hero.jpg";
import studio from "@/assets/studio.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TV Lebara — Conhecimento que atravessa gerações" },
      {
        name: "description",
        content:
          "Entrevistas, conversas, ensinamentos e transmissões dedicadas às tradições de matriz africana. Assine a partir de R$ 30,00/mês.",
      },
      { property: "og:title", content: "TV Lebara — Conhecimento que atravessa gerações" },
      {
        property: "og:description",
        content:
          "Streaming dedicado à Umbanda, ao Candomblé, à Quimbanda, ao Ìfá, à Jurema Sagrada e à cultura afro-brasileira.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(programsQuery),
      context.queryClient.ensureQueryData(newsQuery(3)),
    ]);
  },
  component: Index,
});

const benefits = [
  {
    icon: Radio,
    t: "Programação ao vivo",
    d: "Acompanhe as transmissões da TV Lebara quando estiverem no ar.",
  },
  {
    icon: PlayCircle,
    t: "Conteúdos gravados",
    d: "Entrevistas, palestras e podcasts para assistir quando quiser.",
  },
  {
    icon: LayoutGrid,
    t: "Tudo em um só lugar",
    d: "Programação e conteúdos organizados em uma única plataforma.",
  },
  {
    icon: Lightbulb,
    t: "Novos aprendizados",
    d: "Histórias e perspectivas das tradições abordadas pelo canal.",
  },
  {
    icon: MonitorSmartphone,
    t: "Acesso pela internet",
    d: "Computador, tablet e celular compatíveis.",
  },
  {
    icon: RefreshCw,
    t: "Renovação automática",
    d: "Sua assinatura segue ativa, e você cancela quando quiser.",
  },
];

function Index() {
  const { data: programs } = useSQ(programsQuery);
  const { data: news } = useSQ(newsQuery(3));
  const live = programs.find((p) => p.status === "ao-vivo") ?? programs[0];
  if (!live) return null;
  const rest = programs.filter((p) => p !== live);
  return (
    <>
      {/* Hero */}
      <section className="px-3 pt-24 md:px-5 md:pt-28">
        <div className="relative isolate mx-auto flex min-h-[80vh] max-w-7xl items-end overflow-hidden rounded-[2rem]">
          <img
            src={hero}
            alt="Roda de conversa com uma mais velha compartilhando ensinamentos"
            width={1920}
            height={1088}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-hero-overlay" />
          <div className="grid w-full gap-10 p-6 pb-10 md:p-14 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div className="animate-rise text-ink-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/20 bg-ink-foreground/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
                <span className="live-dot h-2 w-2 rounded-full bg-primary-glow text-primary-glow" />{" "}
                Streaming de cultura e tradição
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.04] md:text-5xl xl:text-6xl">
                Conhecimento que atravessa gerações.
                <span className="block text-primary-glow">Histórias que merecem ser ouvidas.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-foreground/85">
                Entrevistas, conversas, ensinamentos e transmissões dedicadas às tradições de matriz
                africana, num só lugar.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="hero" className="rounded-full">
                  <Link to="/teste-gratis">Criar conta e testar 4h</Link>
                </Button>
                <Button asChild size="lg" variant="heroOutline" className="rounded-full">
                  <Link to="/assinar">
                    Assinar agora <ArrowRight />
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-ink-foreground/70">
                Cadastro gratuito para testar 4 horas ou assinar o plano oficial com credenciais
                liberadas após o pagamento.
              </p>
            </div>

            {/* Card ao vivo */}
            <Link
              to="/programacao"
              className="group hidden animate-rise rounded-3xl border border-ink-foreground/15 bg-ink/50 p-3 text-ink-foreground backdrop-blur-xl transition-transform hover:-translate-y-1 lg:block"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <img src={programImage(live)} alt="" className="aspect-video w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <StatusBadge status={live.status} />
                </div>
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-primary shadow-glow transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 fill-current" />
                  </span>
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm text-primary-glow">
                  {live.category} · {live.time}
                </p>
                <p className="font-display text-xl font-bold">{live.title}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <StartOptions />

      {/* Apresentação */}
      <section id="como-funciona" className="py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <img
              src={studio}
              alt="Gravação de entrevista em estúdio"
              loading="lazy"
              width={1280}
              height={960}
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-lift"
            />
            <div className="absolute -bottom-6 -right-3 hidden rounded-2xl bg-primary px-6 py-4 text-primary-foreground shadow-glow md:block">
              <p className="font-display text-lg font-extrabold">Ao vivo e sob demanda</p>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">Sobre o canal</p>
            <h2 className="text-3xl font-extrabold md:text-5xl">
              Um espaço para ouvir, aprender e compartilhar
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              A TV Lebara nasceu para ampliar o acesso a conteúdos sobre as religiões de matriz
              africana, valorizando experiências, tradições e conhecimentos partilhados por
              diferentes gerações.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Transmissões, entrevistas, palestras e podcasts para acompanhar ao vivo ou quando
              puder.
            </p>
          </div>
        </div>
      </section>

      {/* Programação */}
      <section className="py-12">
        <div className="container-page">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Programação</p>
              <h2 className="text-3xl font-extrabold md:text-5xl">
                O que está acontecendo na TV Lebara
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/programacao">
                Ver grade completa <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 lg:row-span-2">
              <ProgramCard p={live} large />
            </div>
            {rest.slice(0, 2).map((p) => (
              <ProgramCard key={p.slug} p={p} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {rest.slice(2, 5).map((p) => (
              <ProgramCard key={p.slug} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-24">
        <div className="container-page">
          <p className="eyebrow mb-3">Explore</p>
          <h2 className="mb-10 text-3xl font-extrabold md:text-5xl">Caminhos para descobrir</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/conteudos"
                search={{ categoria: c.slug }}
                className="group inline-flex items-center gap-3 rounded-full border bg-card px-6 py-4 font-display text-lg font-bold transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
              >
                {c.name}
                <ArrowRight className="h-4 w-4 text-primary transition-all group-hover:translate-x-1 group-hover:text-primary-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  Notícias e Novidades
                </p>
                <h2 className="mt-2 text-3xl font-extrabold md:text-5xl">Últimas da TV Lebara</h2>
              </div>
              <Link
                to="/noticias"
                className="inline-flex items-center gap-2 font-semibold text-primary"
              >
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} n={n} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefícios */}
      <section className="px-3 md:px-5">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-ink px-6 py-20 text-ink-foreground md:px-14">
          <h2 className="mb-12 max-w-2xl text-3xl font-extrabold md:text-5xl">
            Mais perto de tudo o que a TV Lebara tem para oferecer
          </h2>
          <div className="grid gap-px overflow-hidden rounded-3xl bg-ink-foreground/10 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.t}
                className="group bg-ink p-8 transition-colors hover:bg-ink-foreground/5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-glow transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <b.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-6 text-xl font-bold">{b.t}</h3>
                <p className="mt-2 text-ink-foreground/65">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preço */}
      <section className="py-24">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow mb-3">Assinatura</p>
            <h2 className="text-3xl font-extrabold md:text-5xl">
              A TV Lebara com você, todos os meses
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Escolha entre Premium (1 TV) e Premium Plus (até 3 TVs), nas opções mensal,
              trimestral, semestral ou anual. Antes de pagar, você vê todas as condições de
              renovação, cobrança e cancelamento. Ainda não conhece?{" "}
              <Link to="/teste-gratis" className="font-semibold text-primary hover:underline">
                Crie sua conta e teste grátis por 4 horas
              </Link>
              .
            </p>
          </div>
          <PlanCard />
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow mb-3">Dúvidas</p>
            <h2 className="text-3xl font-extrabold md:text-5xl">Perguntas frequentes</h2>
            <Link
              to="/faq"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FaqList limit={6} />
        </div>
      </section>
    </>
  );
}
