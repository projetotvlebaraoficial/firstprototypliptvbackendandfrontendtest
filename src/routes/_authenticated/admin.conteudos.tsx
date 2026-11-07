import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ChevronDown, FileText, Play, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { programImage } from "@/components/site/ProgramCard";
import { adminProgramsQuery } from "@/lib/content";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageUpload } from "@/components/site/ImageUpload";
import { categories } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Prog = Database["public"]["Tables"]["programs"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/conteudos")({
  head: () => ({ meta: [{ title: "Conteúdos — Painel TV Lebara" }, { name: "description", content: "Grade, aulas e transmissão ao vivo." }, { property: "og:title", content: "Conteúdos — Painel TV Lebara" }, { property: "og:description", content: "Grade, aulas e transmissão ao vivo." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminProgramsQuery),
  component: Contents,
});

const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const sel = "mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm";

function useRefresh() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: ["admin-programs"] }); qc.invalidateQueries({ queryKey: ["programs"] }); qc.invalidateQueries({ queryKey: ["lessons"] }); qc.invalidateQueries({ queryKey: ["live"] }); };
}

function Contents() {
  const { data } = useSuspenseQuery(adminProgramsQuery);
  const refresh = useRefresh();
  const [editing, setEditing] = useState<Prog | "new" | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function saveLive(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rows = [
      { key: "live_url", value: String(f.get("live_url") ?? "").trim().slice(0, 300) },
      { key: "live_title", value: String(f.get("live_title") ?? "").trim().slice(0, 150) },
      { key: "live_on", value: f.get("live_on") === "on" ? "true" : "false" },
    ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("site_settings").upsert(rows);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Transmissão atualizada"); refresh();
  }

  async function removeProgram(p: Prog) {
    if (!confirm(`Remover "${p.title}" e todas as suas aulas?`)) return;
    const { error } = await supabase.from("programs").delete().eq("slug", p.slug);
    if (error) return void toast.error("Não foi possível remover.");
    toast.success("Programa removido"); refresh();
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Conteúdos</h1>
      <p className="text-muted-foreground">Gerencie a transmissão ao vivo, a grade de programas e as aulas gravadas (vídeos e textos).</p>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Transmissão ao vivo</h2>
        <form onSubmit={saveLive} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <div><Label htmlFor="live_url">Link do YouTube</Label><Input id="live_url" name="live_url" defaultValue={data.settings["live_url"] ?? ""} placeholder="https://www.youtube.com/watch?v=… ou link do canal" className="mt-1.5" /></div>
          <div><Label htmlFor="live_title">Título da transmissão</Label><Input id="live_title" name="live_title" defaultValue={data.settings["live_title"] ?? ""} className="mt-1.5" /></div>
          <label className="flex items-center gap-2 pb-2 text-sm font-medium"><Switch name="live_on" defaultChecked={data.settings["live_on"] === "true"} />No ar</label>
          <Button type="submit" className="rounded-full">Salvar</Button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Grade de programas</h2><Button size="sm" className="rounded-full" onClick={() => setEditing("new")}><Plus />Novo programa</Button></div>
        <ul className="mt-4 divide-y">
          {data.programs.map((p) => (
            <li key={p.slug} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <img src={programImage(p)} alt="" className="h-12 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1"><p className="font-semibold">{p.title} {!p.published && <span className="ml-1 rounded bg-muted px-1.5 text-[10px]">OCULTO</span>}</p><p className="text-xs text-muted-foreground">{p.category} · {p.status} · {p.day} {p.time} · {data.lessons.filter((l) => l.program_slug === p.slug).length} aulas</p></div>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setOpen(open === p.slug ? null : p.slug)}>Aulas <ChevronDown className={open === p.slug ? "rotate-180" : ""} /></Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(p)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => removeProgram(p)} aria-label="Remover"><Trash2 /></Button>
              </div>
              {open === p.slug && <Lessons slug={p.slug} lessons={data.lessons.filter((l) => l.program_slug === p.slug)} />}
            </li>
          ))}
        </ul>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">{editing && <ProgramForm p={editing === "new" ? null : editing} count={data.programs.length} done={() => { setEditing(null); refresh(); }} />}</DialogContent>
      </Dialog>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
const PRESETS = ["30 min", "60 min", "90 min", "120 min"];

function ProgramForm({ p, count, done }: { p: Prog | null; count: number; done: () => void }) {
  const parsed = p?.day ? parse(p.day, "dd/MM/yyyy", new Date()) : undefined;
  const [day, setDay] = useState<Date | undefined>(parsed && isValid(parsed) ? parsed : undefined);
  const initDur = p?.duration ?? "60 min";
  const [dur, setDur] = useState(PRESETS.includes(initDur) ? initDur : "custom");
  const m = initDur.match(/^(\d+)\s*(min|h)/);
  const [customN, setCustomN] = useState(PRESETS.includes(initDur) ? "" : (m?.[1] ?? ""));
  const [customU, setCustomU] = useState<"min" | "h">(m?.[2] === "h" ? "h" : "min");
  const [image, setImage] = useState<string | null>(p?.image_url ?? null);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string, n = 200) => String(f.get(k) ?? "").trim().slice(0, n);
    const title = g("title", 120);
    if (!title) return;
    let duration = dur;
    if (dur === "custom") {
      const n = parseInt(customN, 10);
      if (!n || n < 1 || n > 999) return void toast.error("Informe a duração personalizada.");
      duration = customU === "h" ? `${n} h` : `${n} min`;
    }
    const row = { title, category: g("category", 60), description: g("description", 1000), rating: g("rating", 2), status: g("status", 10), day: day ? format(day, "dd/MM/yyyy") : "", time: g("time", 5), duration, image_url: image, published: f.get("published") === "on" };
    const { error } = p ? await supabase.from("programs").update(row).eq("slug", p.slug) : await supabase.from("programs").insert({ ...row, slug: slugify(title) || crypto.randomUUID().slice(0, 8), sort: count + 1, image: "hero" });
    if (error) return void toast.error(error.code === "23505" ? "Já existe um programa com esse nome." : "Não foi possível salvar.");
    toast.success("Programa salvo"); done();
  }
  return (
    <>
      <DialogHeader><DialogTitle>{p ? "Editar programa" : "Novo programa"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Título</Label><Input name="title" defaultValue={p?.title} required className="mt-1.5" /></div>
        <div><Label>Categoria</Label><select name="category" defaultValue={p?.category ?? categories[0].name} className={sel}>{p && !categories.some((c) => c.name === p.category) && <option>{p.category}</option>}{categories.map((c) => <option key={c.slug}>{c.name}</option>)}</select></div>
        <div><Label>Situação</Label><select name="status" defaultValue={p?.status ?? "gravado"} className={sel}><option value="ao-vivo">Ao vivo</option><option value="em-breve">Em breve</option><option value="gravado">Gravado</option></select></div>
        <div><Label>Dia</Label>
          <Popover><PopoverTrigger asChild><Button type="button" variant="outline" className={cn("mt-1.5 h-10 w-full justify-start font-normal", !day && "text-muted-foreground")}><CalendarIcon />{day ? format(day, "dd/MM/yyyy") : "dd/mm/aaaa"}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={day} onSelect={setDay} locale={ptBR} initialFocus className="pointer-events-auto p-3" /></PopoverContent></Popover>
        </div>
        <div><Label>Horário</Label><select name="time" defaultValue={HOURS.includes(p?.time ?? "") ? p!.time : "20:00"} className={sel}>{HOURS.map((h) => <option key={h}>{h}</option>)}</select></div>
        <div><Label>Duração</Label><select value={dur} onChange={(e) => setDur(e.target.value)} className={sel}>{PRESETS.map((d) => <option key={d} value={d}>{d.replace(" min", " minutos")}</option>)}<option value="custom">Personalizado</option></select></div>
        {dur === "custom" ? (
          <div><Label>Duração personalizada</Label><div className="mt-1.5 flex gap-2"><Input type="number" min={1} max={999} value={customN} onChange={(e) => setCustomN(e.target.value)} placeholder="Ex.: 45" /><select value={customU} onChange={(e) => setCustomU(e.target.value as "min" | "h")} className="h-10 rounded-md border bg-background px-2 text-sm"><option value="min">minutos</option><option value="h">horas</option></select></div></div>
        ) : <div />}
        <div><Label>Classificação</Label><select name="rating" defaultValue={p?.rating ?? "L"} className={sel}>{["L", "10", "12", "14", "16", "18"].map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="sm:col-span-2"><Label>Imagem de capa (opcional)</Label><ImageUpload value={image} onChange={setImage} folder="programas" /></div>
        <div className="sm:col-span-2"><Label>Descrição</Label><Textarea name="description" defaultValue={p?.description} className="mt-1.5" /></div>
        <label className="flex items-center gap-2 text-sm font-medium"><Switch name="published" defaultChecked={p?.published ?? true} />Visível no site</label>
        <Button type="submit" className="rounded-full sm:col-start-2">Salvar</Button>
      </form>
    </>
  );
}

function Lessons({ slug, lessons }: { slug: string; lessons: Lesson[] }) {
  const refresh = useRefresh();
  const [edit, setEdit] = useState<Lesson | "new" | null>(null);
  async function remove(id: string) {
    if (!confirm("Remover esta aula?")) return;
    await supabase.from("lessons").delete().eq("id", id); refresh();
  }
  return (
    <div className="ml-0 mt-3 rounded-xl bg-muted/50 p-3 md:ml-24">
      {lessons.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma aula ainda.</p>}
      {lessons.map((l) => (
        <div key={l.id} className="flex items-center gap-2 py-1.5 text-sm">
          {l.kind === "texto" ? <FileText className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="text-muted-foreground">{l.module} ·</span><span className="flex-1 font-medium">{l.title}{!l.published && " (oculta)"}</span>
          <Button size="sm" variant="ghost" onClick={() => setEdit(l)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => remove(l.id)} aria-label="Remover"><Trash2 /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" className="mt-2 rounded-full" onClick={() => setEdit("new")}><Plus />Adicionar aula</Button>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">{edit && <LessonForm slug={slug} l={edit === "new" ? null : edit} next={lessons.length + 1} lastModule={lessons.at(-1)?.module} done={() => { setEdit(null); refresh(); }} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function LessonForm({ slug, l, next, lastModule, done }: { slug: string; l: Lesson | null; next: number; lastModule?: string | undefined; done: () => void }) {
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string, n = 300) => String(f.get(k) ?? "").trim().slice(0, n);
    const row = { module: g("module", 80) || "Módulo 1", title: g("title", 150), kind: g("kind", 10), video_url: g("video_url") || null, body: g("body", 20000) || null, duration: g("duration", 20) || null, sort: parseInt(g("sort")) || next, published: f.get("published") === "on" };
    const { error } = l ? await supabase.from("lessons").update(row).eq("id", l.id) : await supabase.from("lessons").insert({ ...row, program_slug: slug });
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Aula salva"); done();
  }
  return (
    <>
      <DialogHeader><DialogTitle>{l ? "Editar aula" : "Nova aula"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <div><Label>Módulo</Label><Input name="module" defaultValue={l?.module ?? lastModule ?? "Módulo 1"} className="mt-1.5" /></div>
        <div><Label>Tipo</Label><select name="kind" defaultValue={l?.kind ?? "video"} className={sel}><option value="video">Vídeo</option><option value="texto">Texto</option></select></div>
        <div className="sm:col-span-2"><Label>Título</Label><Input name="title" defaultValue={l?.title} required className="mt-1.5" /></div>
        <div className="sm:col-span-2"><Label>Link do vídeo (YouTube ou Vimeo)</Label><Input name="video_url" defaultValue={l?.video_url ?? ""} placeholder="https://youtu.be/…" className="mt-1.5" /></div>
        <div className="sm:col-span-2"><Label>Texto / material de apoio</Label><Textarea name="body" defaultValue={l?.body ?? ""} rows={6} className="mt-1.5" /></div>
        <div><Label>Duração</Label><Input name="duration" defaultValue={l?.duration ?? ""} placeholder="45 min" className="mt-1.5" /></div>
        <div><Label>Ordem</Label><Input name="sort" type="number" defaultValue={l?.sort ?? next} className="mt-1.5" /></div>
        <label className="flex items-center gap-2 text-sm font-medium"><Switch name="published" defaultChecked={l?.published ?? true} />Publicada</label>
        <Button type="submit" className="rounded-full sm:col-start-2">Salvar</Button>
      </form>
    </>
  );
}
