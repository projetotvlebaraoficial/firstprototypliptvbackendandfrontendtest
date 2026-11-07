import { Link } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { newsKindLabel } from "@/lib/site";
import { fmtDateTime } from "@/lib/content";

export type NewsItem = { slug: string; title: string; category: string; kind: string; summary: string; cover_url: string | null; author_name: string; author_role: string; created_at: string };

export function NewsCard({ n }: { n: NewsItem }) {
  return (
    <Link to="/noticias/$slug" params={{ slug: n.slug }} className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {n.cover_url ? <img src={n.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-primary"><Newspaper className="h-10 w-10" /></div>}
        <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{newsKindLabel(n.kind)}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{n.category}</p>
        <h3 className="mt-1 font-display text-lg font-bold leading-snug">{n.title}</h3>
        {n.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{n.summary}</p>}
        <p className="mt-auto pt-4 text-xs text-muted-foreground">{n.author_name} · {fmtDateTime(n.created_at)}</p>
      </div>
    </Link>
  );
}
