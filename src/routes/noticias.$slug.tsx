import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fmtDateTime, newsItemQuery } from "@/lib/content";
import { newsKindLabel } from "@/lib/site";

export const Route = createFileRoute("/noticias/$slug")({
  loader: async ({ context, params }) => {
    const n = await context.queryClient.ensureQueryData(newsItemQuery(params.slug));
    if (!n) throw notFound();
    return n;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Notícia — TV Lebara" }, { name: "robots", content: "noindex" }] };
    const d = loaderData.summary || loaderData.body.slice(0, 155);
    const img = loaderData.cover_url?.startsWith("https://") ? [{ property: "og:image", content: loaderData.cover_url }, { name: "twitter:image", content: loaderData.cover_url }] : [];
    return { meta: [
      { title: `${loaderData.title} — TV Lebara` }, { name: "description", content: d },
      { property: "og:title", content: loaderData.title }, { property: "og:description", content: d },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" }, ...img,
    ] };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-32 text-center"><h1 className="font-display text-3xl font-bold">Notícia não encontrada</h1><Link to="/noticias" className="mt-4 inline-block text-primary underline">Ver todas as notícias e novidades</Link></div>
  ),
  component: Article,
});

function Article() {
  const { slug } = Route.useParams();
  const { data: n } = useSuspenseQuery(newsItemQuery(slug));
  if (!n) return null;
  const edited = new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 60_000;
  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-32 md:px-6">
      <Link to="/noticias" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Todas as notícias e novidades</Link>
      <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">{newsKindLabel(n.kind)}</span>
        <span className="rounded-full bg-muted px-3 py-1">{n.category}</span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-5xl">{n.title}</h1>
      {n.summary && <p className="mt-4 text-lg text-muted-foreground">{n.summary}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 border-y py-4 text-sm">
        <p><span className="font-semibold">{n.author_name}</span>{n.author_role && <span className="text-muted-foreground"> · {n.author_role}</span>}</p>
        <p className="text-muted-foreground">Postado em: {fmtDateTime(n.created_at)}{edited && <> — Última alteração em: {fmtDateTime(n.updated_at)}</>}</p>
      </div>
      {n.cover_url && <img src={n.cover_url} alt="" className="mt-8 w-full rounded-3xl object-cover" />}
      <div className="mt-8 space-y-4 whitespace-pre-line text-lg leading-relaxed">{n.body}</div>
    </article>
  );
}
