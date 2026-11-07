import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AccountShell } from "@/components/site/AccountShell";
import { ProgramCard } from "@/components/site/ProgramCard";
import { accountQuery } from "@/lib/account";
import { programsQuery } from "@/lib/content";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assistir/")({
  head: () => ({ meta: [{ title: "Assistir — TV Lebara" }, { name: "description", content: "Catálogo exclusivo para assinantes TV Lebara." }, { property: "og:title", content: "Assistir — TV Lebara" }, { property: "og:description", content: "Catálogo exclusivo para assinantes." }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(programsQuery); return context.queryClient.ensureQueryData(accountQuery); },
  component: Catalog,
});

function Catalog() {
  useSuspenseQuery(accountQuery);
  const { data: programs } = useSuspenseQuery(programsQuery);
  const cats = ["Todos", ...Array.from(new Set(programs.map((p) => p.category)))];
  const [cat, setCat] = useState("Todos");
  const list = cat === "Todos" ? programs : programs.filter((p) => p.category === cat);
  return (
    <AccountShell title="Assistir" subtitle="Ao vivo e gravados — escolha o que assistir agora.">
      <Link to="/assistir/ao-vivo" className="mb-6 flex items-center gap-4 rounded-3xl bg-ink p-5 text-ink-foreground"><span className="grid h-12 w-12 place-items-center rounded-full bg-primary"><Radio className="h-6 w-6" /></span><div><p className="font-display text-lg font-bold">Transmissão ao vivo</p><p className="text-sm text-ink-foreground/70">Abrir o canal ao vivo da TV Lebara</p></div></Link>
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm font-medium ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{c}</button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => <Link key={p.slug} to="/assistir/$slug" params={{ slug: p.slug }}><ProgramCard p={p} /></Link>)}
      </div>
    </AccountShell>
  );
}
