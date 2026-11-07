import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ExternalLink, Newspaper, Plus, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/site/ImageUpload";
import { adminNewsQuery, fmtDateTime } from "@/lib/content";
import { accountQuery } from "@/lib/account";
import { roleLabel } from "@/lib/admin-query";
import { categories, newsKindLabel, newsKinds } from "@/lib/site";
import type { Database } from "@/integrations/supabase/types";

type News = Database["public"]["Tables"]["news"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/noticias")({
  head: () => ({ meta: [{ title: "Notícias — Painel TV Lebara" }, { name: "description", content: "Escreva e publique notícias." }, { property: "og:title", content: "Notícias — Painel TV Lebara" }, { property: "og:description", content: "Escreva e publique notícias." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminNewsQuery),
  component: AdminNews,
});

const sel = "mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm";
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

function AdminNews() {
  const { data } = useSuspenseQuery(adminNewsQuery);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<News | "new" | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-news"] }); qc.invalidateQueries({ queryKey: ["news"] }); qc.invalidateQueries({ queryKey: ["news-item"] }); };

  async function remove(n: News) {
    if (!confirm(`Remover a notícia "${n.title}"?`)) return;
    const { error } = await supabase.from("news").delete().eq("id", n.id);
    if (error) return void toast.error("Não foi possível remover.");
    toast.success("Notícia removida"); refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-extrabold">Notícias</h1><p className="text-muted-foreground">Publicadas na página inicial do site e no painel de todos os usuários (Free e Premium).</p></div>
        <Button className="rounded-full" onClick={() => setEditing("new")}><Plus />Nova notícia</Button>
      </div>
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        {data.length === 0 && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Newspaper className="h-4 w-4" />Nenhuma notícia ainda. Clique em "Nova notícia".</p>}
        <ul className="divide-y">
          {data.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center gap-3 py-3">
              {n.cover_url ? <img src={n.cover_url} alt="" className="h-12 w-20 rounded-lg object-cover" /> : <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-muted"><Newspaper className="h-5 w-5 text-muted-foreground" /></div>}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.featured && <Star className="mr-1 inline h-3.5 w-3.5 fill-primary text-primary" />}{n.title} {!n.published && <span className="ml-1 rounded bg-muted px-1.5 text-[10px]">RASCUNHO</span>}</p>
                <p className="text-xs text-muted-foreground">{newsKindLabel(n.kind)} · {n.category} · {n.author_name} ({n.author_role}) · Postado em {fmtDateTime(n.created_at)} · Alterado em {fmtDateTime(n.updated_at)}</p>
              </div>
              {n.published && <Button asChild size="sm" variant="ghost"><Link to="/noticias/$slug" params={{ slug: n.slug }} target="_blank" aria-label="Ver no site"><ExternalLink /></Link></Button>}
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(n)}>Editar</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(n)} aria-label="Remover"><Trash2 /></Button>
            </li>
          ))}
        </ul>
      </section>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">{editing && <NewsForm n={editing === "new" ? null : editing} done={() => { setEditing(null); refresh(); }} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function NewsForm({ n, done }: { n: News | null; done: () => void }) {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const [cover, setCover] = useState<string | null>(n?.cover_url ?? null);
  const [saving, setSaving] = useState(false);
  const authorName = n?.author_name ?? (acc.profile?.full_name || acc.user.email || "Equipe TV Lebara");
  const authorRole = n?.author_role ?? roleLabel(acc.roles);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
    const title = g("title", 160);
    const body = g("body", 20000);
    if (!title || !body) return void toast.error("Preencha o título e o texto.");
    const kind = g("kind", 30);
    if (!newsKinds.some((k) => k.value === kind)) return void toast.error("Escolha o tipo.");
    const row = { title, category: g("category", 60), kind, summary: g("summary", 300), body, cover_url: cover, published: f.get("published") === "on", featured: f.get("featured") === "on" };
    setSaving(true);
    const { error } = n
      ? await supabase.from("news").update({ ...row, updated_at: new Date().toISOString() }).eq("id", n.id)
      : await supabase.from("news").insert({ ...row, slug: `${slugify(title) || "noticia"}-${crypto.randomUUID().slice(0, 6)}`, author_id: acc.user.id, author_name: authorName, author_role: authorRole });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success(n ? "Notícia atualizada" : "Notícia publicada"); done();
  }

  return (
    <>
      <DialogHeader><DialogTitle>{n ? "Editar notícia" : "Nova notícia"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Título</Label><Input name="title" defaultValue={n?.title} required maxLength={160} className="mt-1.5" /></div>
        <div><Label>Categoria</Label><select name="category" defaultValue={n?.category ?? categories[0].name} className={sel}>{categories.map((c) => <option key={c.slug}>{c.name}</option>)}</select></div>
        <div><Label>Tipo</Label><select name="kind" defaultValue={n?.kind ?? "novidade"} className={sel}>{newsKinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></div>
        <div className="rounded-xl bg-muted/60 p-3 text-sm sm:col-span-2">Responsável: <span className="font-semibold">{authorName}</span> · {authorRole}
          {n && <p className="mt-1 text-xs text-muted-foreground">Postado em: {fmtDateTime(n.created_at)} — Última alteração em: {fmtDateTime(n.updated_at)}</p>}</div>
        <div className="sm:col-span-2"><Label>Foto de capa</Label><ImageUpload value={cover} onChange={setCover} folder="noticias" /></div>
        <div className="sm:col-span-2"><Label>Resumo (aparece no cartão, opcional)</Label><Input name="summary" defaultValue={n?.summary} maxLength={300} className="mt-1.5" /></div>
        <div className="sm:col-span-2"><Label>Texto</Label><Textarea name="body" defaultValue={n?.body} required rows={12} className="mt-1.5" /></div>
        <label className="flex items-center gap-2 text-sm font-medium"><Switch name="published" defaultChecked={n?.published ?? true} />Publicada</label>
        <label className="flex items-center gap-2 text-sm font-medium"><Switch name="featured" defaultChecked={n?.featured ?? false} />Destaque (aparece primeiro)</label>
        <Button type="submit" disabled={saving} className="rounded-full sm:col-span-2">{saving ? "Salvando…" : "Salvar"}</Button>
      </form>
    </>
  );
}
