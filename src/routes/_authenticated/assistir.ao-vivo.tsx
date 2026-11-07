import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Lock, Radio } from "lucide-react";
import { AccountShell } from "@/components/site/AccountShell";
import { Button } from "@/components/ui/button";
import { accountQuery } from "@/lib/account";
import { liveQuery, youtubeEmbed } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/assistir/ao-vivo")({
  head: () => ({ meta: [{ title: "Ao vivo — TV Lebara" }, { name: "description", content: "Transmissão ao vivo da TV Lebara." }, { property: "og:title", content: "Ao vivo — TV Lebara" }, { property: "og:description", content: "Transmissão ao vivo da TV Lebara." }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(accountQuery), context.queryClient.ensureQueryData(liveQuery)]); },
  component: Live,
});

function Live() {
  const { data } = useSuspenseQuery(accountQuery);
  const { data: live } = useSuspenseQuery(liveQuery);
  const active = data.subscription?.status === "ativa";
  const embed = youtubeEmbed(live.url);
  const on = live.on && !!embed;
  return (
    <AccountShell title="Ao vivo" subtitle={on ? live.title || "Transmissão em andamento" : "Canal offline no momento"}>
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink text-ink-foreground">
        {on && active ? (
          <>
            <iframe src={`${embed}${embed!.includes("?") ? "&" : "?"}autoplay=1`} title={live.title || "Ao vivo"} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><span className="live-dot h-2 w-2 rounded-full bg-primary-foreground" />AO VIVO</span>
          </>
        ) : (
          <div className="grid h-full place-items-center p-6 text-center">
            <div className="max-w-md">
              {on ? <Lock className="mx-auto h-10 w-10 text-primary-glow" /> : <Radio className="mx-auto h-10 w-10 text-primary-glow" />}
              <p className="mt-3 font-display text-2xl font-bold">{on ? "Exclusivo para Usuários Premium" : "Sem transmissão agora"}</p>
              <p className="mt-2 text-ink-foreground/75">{on ? "Assine para assistir à transmissão." : "Neste momento, não há transmissão ao vivo. Confira os conteúdos gravados ou consulte a programação para saber o que vem por aí."}</p>
              <div className="mt-5 flex justify-center gap-2">
                {on ? <Button asChild className="rounded-full"><Link to="/checkout">Assinar agora</Link></Button> : <>
                  <Button asChild className="rounded-full"><Link to="/assistir">Gravados</Link></Button>
                  <Button asChild variant="outline" className="rounded-full border-ink-foreground/30 bg-transparent text-ink-foreground"><Link to="/programacao">Programação</Link></Button></>}
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Comentários não ficam disponíveis durante a transmissão ao vivo.</p>
    </AccountShell>
  );
}
