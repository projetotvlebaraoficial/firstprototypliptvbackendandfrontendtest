import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageShell";

export const Route = createFileRoute("/classificacao-indicativa")({
  head: () => ({
    meta: [
      { title: "Classificação indicativa — TV Lebara" },
      { name: "description", content: "Entenda as faixas de classificação indicativa dos conteúdos da TV Lebara." },
      { property: "og:title", content: "Classificação indicativa — TV Lebara" },
      { property: "og:description", content: "Faixas etárias indicadas para cada conteúdo." },
    ],
  }),
  component: Page,
});

const ratings = [
  ["L", "Livre para todos os públicos"],
  ["10", "Não recomendado para menores de 10 anos"],
  ["12", "Não recomendado para menores de 12 anos"],
  ["14", "Não recomendado para menores de 14 anos"],
  ["16", "Não recomendado para menores de 16 anos"],
  ["18", "Não recomendado para menores de 18 anos"],
];

function Page() {
  return (
    <>
      <PageIntro eyebrow="Famílias" title="Classificação indicativa">
        Cada conteúdo informa a faixa etária indicada, seguindo o modelo do Guia Prático de Classificação Indicativa do Ministério da Justiça. A decisão final sobre o que assistir é sempre das famílias e responsáveis.
      </PageIntro>
      <section className="container-page grid gap-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {ratings.map(([r, d]) => (
          <div key={r} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink font-display text-xl font-extrabold text-ink-foreground">{r}</span>
            <p className="font-medium">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
