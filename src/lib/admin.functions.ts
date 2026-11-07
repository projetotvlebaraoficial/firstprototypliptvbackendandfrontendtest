import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const LIFETIME_END = "2099-12-31T23:59:59Z";

function clientIp() {
  const h =
    getRequestHeader("cf-connecting-ip") ||
    getRequestHeader("x-real-ip") ||
    getRequestHeader("x-forwarded-for") ||
    "";
  return (h.split(",")[0] ?? "").trim().slice(0, 64) || null;
}

/** Records the IP the account was created from (first time) and the latest IP. */
export const trackIp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ip = clientIp();
    if (!ip) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("signup_ip")
      .eq("id", context.userId)
      .maybeSingle();
    await supabaseAdmin
      .from("profiles")
      .update({ last_ip: ip, ...(data && !data.signup_ip ? { signup_ip: ip } : {}) })
      .eq("id", context.userId);
    return { ok: true };
  });

async function roles(supabase: SupabaseClient<Database>, userId: string) {
  const [a, c] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin_chefe" }),
  ]);
  return { admin: !!a.data || !!c.data, chefe: !!c.data };
}

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveAdminAccess } = await import("./admin-access.server");
    const access = await resolveAdminAccess(context.supabase, context.userId, context.claims);
    if (!access.isAdmin) throw new Error("Acesso negado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let authUsers: { users?: Array<{ id: string; email?: string | null; last_sign_in_at?: string | null }> } = {};
    try {
      const result = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      authUsers = result.data ?? {};
    } catch (error) {
      console.error("[TV Lebara] Não foi possível listar utilizadores do Supabase.", error);
    }
    const [profiles, subs, rs, pays, acts] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("subscriptions").select("*"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }),
      supabaseAdmin
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const emails = new Map(
      (authUsers.users ?? []).map((u) => [
        u.id,
        { email: u.email ?? "", last_sign_in: u.last_sign_in_at ?? null },
      ]),
    );
    const users = (profiles.data ?? []).map((p) => ({
      ...p,
      email: emails.get(p.id)?.email ?? "",
      last_sign_in: emails.get(p.id)?.last_sign_in ?? null,
      sub: (subs.data ?? []).find((s) => s.user_id === p.id) ?? null,
      roles: (rs.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
    }));
    return {
      me: {
        id: context.userId,
        admin: access.isAdmin,
        chefe: access.isChefe,
        email: access.email,
        viaEmail: access.viaEmail,
      },
      users,
      payments: pays.data ?? [],
      actions: acts.data ?? [],
    };
  });

type Action =
  | {
      userId: string;
      action: "set_status";
      status: "pendente" | "ativa" | "cancelada" | "expirada";
    }
  | { userId: string; action: "add_days"; days: number }
  | { userId: string; action: "ban"; reason: string }
  | { userId: string; action: "unban" }
  | { userId: string; action: "set_tier"; tier: "premium" | "premium_plus" }
  | { userId: string; action: "set_admin"; value: boolean };

export const adminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: Action) => {
    if (!i || typeof i.userId !== "string") throw new Error("Dados inválidos");
    if (i.action === "add_days" && (!Number.isInteger(i.days) || Math.abs(i.days) > 3650))
      throw new Error("Dias inválidos");
    return i;
  })
  .handler(async ({ data, context }) => {
    const { resolveAdminAccess } = await import("./admin-access.server");
    const access = await resolveAdminAccess(context.supabase, context.userId, context.claims);
    if (!access.isAdmin) throw new Error("Acesso negado");
    const me = { admin: access.isAdmin, chefe: access.isChefe };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const target = await roles(supabaseAdmin, data.userId);
    if (target.chefe && !me.chefe)
      throw new Error("Apenas o Administrador-chefe pode alterar esta conta.");
    if (target.admin && !me.chefe && data.userId !== context.userId)
      throw new Error("Apenas o Administrador-chefe pode alterar outros administradores.");
    const now = new Date();

    if (data.action === "set_status") {
      const end =
        data.status === "ativa" ? new Date(now.getTime() + 30 * 864e5).toISOString() : null;
      const { data: cur } = await supabaseAdmin
        .from("subscriptions")
        .select("current_period_end")
        .eq("user_id", data.userId)
        .maybeSingle();
      const keep =
        cur?.current_period_end && new Date(cur.current_period_end) > now
          ? cur.current_period_end
          : end;
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: data.status,
          current_period_end: data.status === "ativa" ? keep : (cur?.current_period_end ?? null),
          updated_at: now.toISOString(),
        })
        .eq("user_id", data.userId);
    } else if (data.action === "add_days") {
      const { data: cur } = await supabaseAdmin
        .from("subscriptions")
        .select("current_period_end")
        .eq("user_id", data.userId)
        .maybeSingle();
      const base =
        cur?.current_period_end && new Date(cur.current_period_end) > now
          ? new Date(cur.current_period_end)
          : now;
      const end = new Date(base.getTime() + data.days * 864e5);
      await supabaseAdmin
        .from("subscriptions")
        .update({
          current_period_end: end.toISOString(),
          status: end > now ? "ativa" : "expirada",
          updated_at: now.toISOString(),
        })
        .eq("user_id", data.userId);
    } else if (data.action === "set_tier") {
      if (data.tier !== "premium" && data.tier !== "premium_plus")
        throw new Error("Plano inválido");
      await supabaseAdmin
        .from("subscriptions")
        .update({ plan_tier: data.tier, updated_at: now.toISOString() })
        .eq("user_id", data.userId);
    } else if (data.action === "ban" || data.action === "unban") {
      if (data.userId === context.userId) throw new Error("Você não pode banir a si mesmo.");
      const ban = data.action === "ban";
      await supabaseAdmin
        .from("profiles")
        .update({ banned: ban, ban_reason: ban ? String(data.reason || "").slice(0, 300) : null })
        .eq("id", data.userId);
      await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ban_duration: ban ? "876000h" : "none",
      });
    } else if (data.action === "set_admin") {
      if (!me.chefe) throw new Error("Apenas o Administrador-chefe pode definir administradores.");
      if (target.chefe) throw new Error("O cargo do Administrador-chefe não pode ser alterado.");
      if (data.value) {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "ativa",
            current_period_end: LIFETIME_END,
            cancel_at_period_end: false,
          })
          .eq("user_id", data.userId);
      } else {
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", data.userId)
          .eq("role", "admin");
      }
    }
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: context.userId,
      target_user_id: data.userId,
      action: data.action,
      details: data as unknown as Json,
    });
    return { ok: true };
  });
