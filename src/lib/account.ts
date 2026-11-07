import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess } from "@/lib/admin-access.functions";

function cleanMetadataValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Copies name/WhatsApp/CPF collected during site signup (Supabase user
 * metadata) into the profile row when the profile still has those fields
 * empty. This keeps /minha-conta ready for the trial and official plan.
 */
export async function syncProfileFromMetadata(user: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
}) {
  const meta = user.user_metadata ?? {};
  const desired = {
    full_name: cleanMetadataValue(meta["full_name"]),
    whatsapp: cleanMetadataValue(meta["whatsapp"]),
    cpf: cleanMetadataValue(meta["cpf"]),
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,cpf,whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").upsert({ id: user.id, ...desired }, { onConflict: "id" });
    return;
  }

  const patch: { full_name?: string; whatsapp?: string; cpf?: string } = {};
  if (!profile.full_name && desired.full_name) patch.full_name = desired.full_name;
  if (!profile.whatsapp && desired.whatsapp) patch.whatsapp = desired.whatsapp;
  if (!profile.cpf && desired.cpf) patch.cpf = desired.cpf;

  if (Object.keys(patch).length > 0) {
    await supabase.from("profiles").update(patch).eq("id", user.id);
  }
}

export const accountQuery = queryOptions({
  queryKey: ["account"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) throw new Error("Sessão expirada");
    await syncProfileFromMetadata(user).catch(() => undefined);
    const [profile, sub, roles, favs, access] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("favorites").select("program_slug").eq("user_id", user.id),
      // The ADMIN_EMAILS allowlist lives on the server, so the browser asks a
      // server function. If it fails we still fall back to the role table.
      getAdminAccess().catch(() => null),
    ]);
    const roleAdmin = (roles.data ?? []).some(
      (r) => r.role === "admin" || r.role === "admin_chefe",
    );
    const roleChefe = (roles.data ?? []).some((r) => r.role === "admin_chefe");
    return {
      user,
      profile: profile.data,
      subscription: sub.data,
      roles: (roles.data ?? []).map((r) => r.role as string),
      isAdmin: Boolean(access?.isAdmin) || roleAdmin,
      isChefe: Boolean(access?.isChefe) || roleChefe,
      profileComplete: isProfileComplete(profile.data),
      favorites: (favs.data ?? []).map((f) => f.program_slug),
    };
  },
});

export const paymentsQuery = queryOptions({
  queryKey: ["payments"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const statusLabel: Record<string, string> = {
  pendente: "Usuário Free",
  ativa: "Usuário Premium",
  cancelada: "Cancelada",
  expirada: "Expirada",
};

export function isProfileComplete(
  p: {
    full_name?: string | null;
    cpf?: string | null;
    birth_date?: string | null;
    whatsapp?: string | null;
    cep?: string | null;
    address?: string | null;
    address_number?: string | null;
    city?: string | null;
    state?: string | null;
  } | null,
) {
  return (
    !!p &&
    [
      p.full_name,
      p.cpf,
      p.birth_date,
      p.whatsapp,
      p.cep,
      p.address,
      p.address_number,
      p.city,
      p.state,
    ].every((v) => !!v && String(v).trim())
  );
}

// Kept re-exported for existing imports; the implementation lives in the
// browser/server-safe Brazilian helpers module.
export { isValidCpf } from "@/lib/br";

export function tierOf(sub: { plan_tier?: string | null } | null | undefined) {
  return sub?.plan_tier === "premium_plus" ? "premium_plus" : "premium";
}
export function userLabel(
  sub: { status?: string | null; plan_tier?: string | null } | null | undefined,
) {
  if (sub?.status === "ativa")
    return tierOf(sub) === "premium_plus" ? "Usuário Premium Plus" : "Usuário Premium";
  return statusLabel[sub?.status ?? "pendente"] ?? "Usuário Free";
}
export function tvCount(sub: { plan_tier?: string | null } | null | undefined) {
  return tierOf(sub) === "premium_plus" ? "3 TVs" : "1 TV";
}
