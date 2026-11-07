import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = (process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"])!;
  return createClient<Database>((process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"])!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Public program grid (published only). */
export const listPrograms = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("programs").select("*").eq("published", true).order("sort");
  if (error) throw new Error(error.message);
  return data;
});

export const getLiveSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("site_settings").select("key, value");
  const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return { url: m["live_url"] ?? "", title: m["live_title"] ?? "", on: m["live_on"] === "true" };
});

const NEWS_COLS = "id, slug, title, category, kind, summary, cover_url, author_name, author_role, featured, created_at, updated_at";

/** Published news list (public). */
export const listNews = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number } | undefined) => ({ limit: Math.min(Math.max(d?.limit ?? 50, 1), 100) }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await publicClient().from("news").select(NEWS_COLS).eq("published", true).order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows;
  });

export const getNews = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const { data: row } = await publicClient().from("news").select(`${NEWS_COLS}, body`).eq("published", true).eq("slug", data.slug).maybeSingle();
    return row;
  });
