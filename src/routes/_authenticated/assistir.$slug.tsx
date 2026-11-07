import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { FileText, Heart, Lock, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AccountShell, Panel } from "@/components/site/AccountShell";
import { programImage, RatingBadge, StatusBadge } from "@/components/site/ProgramCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { accountQuery } from "@/lib/account";
import { lessonsQuery, programsQuery, youtubeEmbed } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/assistir/$slug")({
  loader: async ({ context, params }) => {
    const list = await context.queryClient.ensureQueryData(programsQuery);
    const p = list.find((x) => x.slug === params.slug);
    if (!p) throw notFound();
    await Promise.all([context.queryClient.ensureQueryData(accountQuery), context.queryClient.ensureQueryData(lessonsQuery(params.slug))]);
    return { title: p.title };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Assistir"} — TV Lebara` }, { name: "description", content: "Assista na TV Lebara." }, { property: "og:title", content: `${loaderData?.title ?? "Assistir"} — TV Lebara` }, { property: "og:description", content: "Assista na TV Lebara." }, { name: "robots", content: "noindex" }] }),
  component: Player,
});

function Player() {
  const { slug } = Route.useParams();
  const { data: programs } = useSuspenseQuery(programsQuery);
  const p = programs.find((x) => x.slug === slug)!;
  const { data } = useSuspenseQuery(accountQuery);
  const { data: lessons } = useSuspenseQuery(lessonsQuery(slug));
  const qc = useQueryClient();
  const active = data.subscription?.status === "ativa";
  const fav = data.favorites.includes(slug);
  const [lessonId, setLessonId] = useState<string | null>(lessons[0]?.id ?? null);
  const lesson = lessons.find((l) => l.id === lessonId);
  const embed = youtubeEmbed(lesson?.video_url);
  const modules = [...new Set(lessons.map((l) => l.module))];

  async function toggleFav() {
    const q = fav
      ? supabase.from("favorites").delete().eq("user_id", data.user.id).eq("program_slug", slug)
      : supabase.from("favorites").insert({ user_id: data.user.id, program_slug: slug });
    const { error } = await q;
    if (error) return void toast.error("Não foi possível atualizar sua lista.");
    toast.success(fav ? "Removido da sua lista" : "Adicionado à sua lista");
    qc.invalidateQueries({ queryKey: ["account"] });
  }

  return (
    <AccountShell title={p.title} subtitle={p.category}>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink text-ink-foreground">
            {active && lesson?.kind === "video" && embed ? (
              <iframe src={embed} title={lesson.title} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : (
              <>
                <img src={programImage(p)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
                <div className="absolute left-5 top-5"><StatusBadge status={p.status} /></div>
                <div className="relative grid h-full place-items-center p-6 text-center">
                  {active ? (
                    <div>
                      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary shadow-glow">{lesson?.kind === "texto" ? <FileText className="h-9 w-9" /> : <Play className="h-9 w-9 fill-current" />}</span>
                      <p className="mt-4 text-ink-foreground/80">{lesson ? (lesson.kind === "texto" ? "Leia o material abaixo." : "O vídeo desta aula ainda não foi adicionado.") : "Nenhuma aula publicada ainda."}</p>
                    </div>
                  ) : (
                    <div className="max-w-sm">
                      <Lock className="mx-auto h-10 w-10 text-primary-glow" />
                      <p className="mt-3 font-display text-2xl font-bold">Conteúdo exclusivo Premium</p>
                      <p className="mt-2 text-ink-foreground/75">Torne-se Usuário Premium para assistir.</p>
                      <Button asChild size="lg" className="mt-5 rounded-full"><Link to="/checkout">Assinar agora</Link></Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <RatingBadge rating={p.rating} />
            <span className="text-sm text-muted-foreground">{p.day} · {p.time} · {p.duration}</span>
            <Button variant="outline" onClick={toggleFav} className="ml-auto rounded-full">
              <Heart className={fav ? "fill-primary text-primary" : ""} />{fav ? "Na minha lista" : "Adicionar à lista"}
            </Button>
          </div>
          {lesson && <h2 className="mt-5 font-display text-2xl font-bold">{lesson.title}</h2>}
          {active && lesson?.body && <div className="mt-3 whitespace-pre-wrap rounded-2xl border bg-card p-5 leading-relaxed">{lesson.body}</div>}
          <p className="mt-4 max-w-3xl text-muted-foreground">{p.description}</p>
          {lesson && p.status !== "ao-vivo" && <Comments lessonId={lesson.id} canPost={active && !data.profile?.banned} userId={data.user.id} isStaff={data.isAdmin} name={data.profile?.full_name || "Assinante"} />}
        </div>
        <aside>
          <Panel className="!p-4">
            <h3 className="px-2 font-display font-bold">Conteúdo</h3>
            {lessons.length === 0 && <p className="px-2 pt-2 text-sm text-muted-foreground">Em breve.</p>}
            {modules.map((m) => (
              <div key={m} className="mt-3">
                <p className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{m}</p>
                {lessons.filter((l) => l.module === m).map((l) => (
                  <button key={l.id} onClick={() => setLessonId(l.id)} className={`mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm ${l.id === lessonId ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}>
                    {l.kind === "texto" ? <FileText className="h-4 w-4 shrink-0" /> : <Play className="h-4 w-4 shrink-0" />}<span className="flex-1">{l.title}</span>{l.duration && <span className="text-xs text-muted-foreground">{l.duration}</span>}
                  </button>
                ))}
              </div>
            ))}
          </Panel>
        </aside>
      </div>
    </AccountShell>
  );
}

function Comments({ lessonId, canPost, userId, isStaff, name }: { lessonId: string; canPost: boolean; userId: string; isStaff: boolean; name: string }) {
  const qc = useQueryClient();
  const key = ["comments", lessonId];
  const { data: comments = [] } = useQuery({
    queryKey: key,
    queryFn: async () => (await supabase.from("comments").select("*").eq("lesson_id", lessonId).order("created_at", { ascending: false })).data ?? [],
  });
  useEffect(() => {
    const ch = supabase.channel(`comments-${lessonId}`).on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `lesson_id=eq.${lessonId}` }, () => qc.invalidateQueries({ queryKey: ["comments", lessonId] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [lessonId, qc]);

  async function post(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim().slice(0, 1000);
    if (!body) return;
    const { error } = await supabase.from("comments").insert({ lesson_id: lessonId, user_id: userId, author_name: name.slice(0, 80), body });
    if (error) return void toast.error("Não foi possível comentar.");
    form.reset();
    qc.invalidateQueries({ queryKey: key });
  }
  async function remove(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <section className="mt-8">
      <h3 className="font-display text-xl font-bold">Comentários ({comments.length})</h3>
      {canPost ? (
        <form onSubmit={post} className="mt-3 space-y-2">
          <Textarea name="body" maxLength={1000} placeholder="Escreva um comentário respeitoso…" required />
          <Button type="submit" className="rounded-full">Comentar</Button>
        </form>
      ) : <p className="mt-2 text-sm text-muted-foreground">Apenas Usuários Premium podem comentar.</p>}
      <ul className="mt-5 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{c.author_name} <span className="font-normal text-muted-foreground">· {new Date(c.created_at).toLocaleString("pt-BR")}</span></p>
              {(c.user_id === userId || isStaff) && <button onClick={() => remove(c.id)} aria-label="Apagar comentário" className="text-muted-foreground hover:text-primary"><Trash2 className="h-4 w-4" /></button>}</div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
