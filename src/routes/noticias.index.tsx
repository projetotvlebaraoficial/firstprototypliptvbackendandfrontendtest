import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { newsQuery } from "@/lib/content";
import { newsKinds } from "@/lib/site";
import { NewsCard } from "@/components/site/NewsCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/noticias/")({
  head: () => ({ meta: [
    { title: "Notícias e Novidades — TV Lebara" },
    { name: "description", content: "Notícias e novidades da TV Lebara: podcasts, bate-papos, aulas e programação ao vivo." },
    { property: "og:title", content: "Notícias e Novidades — TV Lebara" },
    { property: "og:description", content: "Notícias e novidades da TV Lebara: podcasts, bate-papos, aulas e programação ao vivo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQuery(50)),
  component: NewsPage,
});

function NewsPage() {
  const { data } = useSuspenseQuery(newsQuery(50));
  const [kind, setKind] = useState("");
  const list = kind ? data.filter((n) => n.kind === kind) : data;
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-6">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">Notícias e Novidades</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold md:text-5xl">Fique por dentro da TV Lebara</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        {[{ value: "", label: "Todas" }, ...newsKinds].map((k) => (
          <button key={k.value} onClick={() => setKind(k.value)} className={cn("rounded-full border px-4 py-2 text-sm font-medium", kind === k.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{k.label}</button>
        ))}
      </div>
      {list.length === 0 ? <p className="mt-10 text-muted-foreground">Nenhuma notícia publicada ainda.</p> : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((n) => <NewsCard key={n.id} n={n} />)}</div>
      )}
    </div>
  );
}
