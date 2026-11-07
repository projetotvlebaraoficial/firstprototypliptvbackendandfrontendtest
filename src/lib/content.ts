import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLiveSettings, getNews, listNews, listPrograms } from "@/lib/content.functions";
import type { Program } from "@/lib/site";

export const programsQuery = queryOptions({
  queryKey: ["programs"],
  queryFn: async () => (await listPrograms()) as unknown as Program[],
});

export const liveQuery = queryOptions({
  queryKey: ["live"],
  queryFn: () => getLiveSettings(),
  refetchInterval: 30_000,
});

export const lessonsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["lessons", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("program_slug", slug).order("sort");
      if (error) throw error;
      return data;
    },
  });

/** All programs incl. unpublished — for the admin panel (RLS lets staff read them). */
export const adminProgramsQuery = queryOptions({
  queryKey: ["admin-programs"],
  queryFn: async () => {
    const [p, l, s] = await Promise.all([
      supabase.from("programs").select("*").order("sort"),
      supabase.from("lessons").select("*").order("sort"),
      supabase.from("site_settings").select("*"),
    ]);
    return { programs: p.data ?? [], lessons: l.data ?? [], settings: Object.fromEntries((s.data ?? []).map((r) => [r.key, r.value])) as Record<string, string> };
  },
});

/** Converts a YouTube link (watch, youtu.be, live, embed, channel id) into an embed URL. */
export function youtubeEmbed(url?: string | null) {
  if (!url) return null;
  const u = url.trim();
  const ch = u.match(/(UC[\w-]{22})/);
  if (/channel\//.test(u) && ch) return `https://www.youtube.com/embed/live_stream?channel=${ch[1]}`;
  const id = u.match(/(?:v=|youtu\.be\/|embed\/|live\/|shorts\/)([\w-]{11})/)?.[1];
  if (id) return `https://www.youtube.com/embed/${id}`;
  if (/^[\w-]{11}$/.test(u)) return `https://www.youtube.com/embed/${u}`;
  if (/^https:\/\/(player\.vimeo\.com|www\.youtube\.com\/embed)/.test(u)) return u;
  const vimeo = u.match(/vimeo\.com\/(\d+)/)?.[1];
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;
  return null;
}

export const newsQuery = (limit = 50) => queryOptions({ queryKey: ["news", limit], queryFn: () => listNews({ data: { limit } }) });
export const newsItemQuery = (slug: string) => queryOptions({ queryKey: ["news-item", slug], queryFn: () => getNews({ data: { slug } }) });
export const adminNewsQuery = queryOptions({
  queryKey: ["admin-news"],
  queryFn: async () => {
    const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
