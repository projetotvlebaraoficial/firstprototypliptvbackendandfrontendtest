import { Clock } from "lucide-react";
import type { Program } from "@/lib/site";
import { cn } from "@/lib/utils";
import p1 from "@/assets/prog-1.jpg";
import p2 from "@/assets/prog-2.jpg";
import p3 from "@/assets/prog-3.jpg";
import p4 from "@/assets/prog-4.jpg";
import studio from "@/assets/studio.jpg";
import hero from "@/assets/hero.jpg";

export const programImages: Record<string, string> = { p1, p2, p3, p4, studio, hero };
export const programImage = (p: { image: string; image_url?: string | null }) => p.image_url || programImages[p.image] || hero;

export function StatusBadge({ status }: { status: Program["status"] }) {
  if (status === "ao-vivo")
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-wider text-primary-foreground shadow-glow">
        <span className="live-dot h-2 w-2 rounded-full bg-primary-foreground" /> AO VIVO
      </span>
    );
  return (
    <span className="rounded-full bg-ink/75 px-3 py-1 text-xs font-semibold text-ink-foreground backdrop-blur">
      {status === "em-breve" ? "Em breve" : "Gravado"}
    </span>
  );
}

export function RatingBadge({ rating }: { rating: Program["rating"] }) {
  return <span className="grid h-7 min-w-7 place-items-center rounded-md bg-ink px-1.5 text-xs font-extrabold text-ink-foreground" title={`Classificação: ${rating}`}>{rating}</span>;
}

export function ProgramCard({ p, large }: { p: Program; large?: boolean | undefined }) {
  return (
    <article className={cn("group relative overflow-hidden rounded-3xl bg-ink text-ink-foreground", large ? "h-full min-h-[28rem]" : "min-h-80")}>
      <img src={programImage(p)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
      <div className="absolute left-5 top-5 flex gap-2"><StatusBadge status={p.status} /></div>
      <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6">
        <p className="text-sm font-semibold text-primary-glow">{p.category}</p>
        <h3 className={cn("mt-1 font-extrabold", large ? "text-3xl md:text-4xl" : "text-2xl")}>{p.title}</h3>
        <p className={cn("mt-2 text-ink-foreground/75", !large && "line-clamp-2")}>{p.description}</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-ink-foreground/80">
          <RatingBadge rating={p.rating} />
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{p.day} · {p.time}</span>
          <span>· {p.duration}</span>
        </div>
      </div>
    </article>
  );
}
