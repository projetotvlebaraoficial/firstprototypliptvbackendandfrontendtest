import { useSuspenseQuery as useSQ } from "@tanstack/react-query";
import { programsQuery } from "@/lib/content";
import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageShell";
import { ProgramCard, RatingBadge, StatusBadge } from "@/components/site/ProgramCard";

export const Route = createFileRoute("/programacao")({
  head: () => ({
    meta: [
      { title: "Programação — TV Lebara" },
      { name: "description", content: "Grade de programação da TV Lebara: transmissões ao vivo, estreias e conteúdos gravados." },
      { property: "og:title", content: "Programação da TV Lebara" },
      { property: "og:description", content: "Confira o que vai ao ar na TV Lebara." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(programsQuery),
  component: Programacao,
});

function Programacao() {
  const { data: programs } = useSQ(programsQuery);
  const days = [...new Set(programs.map((p) => p.day))];
  return (
    <>
      <PageIntro eyebrow="Grade" title="Programação">Horários de Brasília. A grade pode mudar; avisamos sempre que houver alterações.</PageIntro>
      <section className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.slice(0, 3).map((p) => <ProgramCard key={p.slug} p={p} />)}
        </div>

        <h2 className="mt-20 mb-6 text-3xl font-extrabold">Grade da semana</h2>
        <div className="space-y-8">
          {days.map((d) => (
            <div key={d}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-primary">{d}</h3>
              <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
                {programs.filter((p) => p.day === d).map((p) => (
                  <li key={p.slug} className="grid items-center gap-3 p-5 transition-colors hover:bg-muted/60 md:grid-cols-[6rem_1fr_auto]">
                    <span className="font-display text-2xl font-extrabold">{p.time}</span>
                    <div>
                      <p className="text-lg font-bold">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{p.category} · {p.duration}</p>
                    </div>
                    <div className="flex items-center gap-2"><RatingBadge rating={p.rating} /><StatusBadge status={p.status} /></div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
