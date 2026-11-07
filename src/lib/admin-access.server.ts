// Server-only administrator access helpers.
//
// The primary check is the e-mail allowlist in ADMIN_EMAILS (comma/space
// separated, case-insensitive). Existing role-based administrators continue to
// work as a fallback, so this change does not lock anyone out while the
// allowlist is being configured.
//
// Keep this module server-only: it reads process.env and must never be bundled
// into the browser.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AdminAccess = {
  isAdmin: boolean;
  isChefe: boolean;
  email: string | null;
  viaEmail: boolean;
};

/** Normalizes a raw ADMIN_EMAILS value into a unique list of lowercase e-mails. */
export function parseAdminEmails(raw: string | undefined | null): string[] {
  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 3 && value.includes("@")),
    ),
  );
}

/** Reads the allowlist from the server environment (loaded from .env.local). */
export function adminEmailsFromEnv(): string[] {
  return parseAdminEmails(process.env["ADMIN_EMAILS"]);
}

export function emailFromClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") return null;

  const record = claims as Record<string, unknown>;
  const direct = record["email"];
  if (typeof direct === "string" && direct.trim()) return direct.trim().toLowerCase();

  const metadata = record["user_metadata"];
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const nested = (metadata as Record<string, unknown>)["email"];
    if (typeof nested === "string" && nested.trim()) return nested.trim().toLowerCase();
  }

  return null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmailsFromEnv().includes(email.trim().toLowerCase());
}

async function roleFlags(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ admin: boolean; chefe: boolean }> {
  try {
    const [admin, chief] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin_chefe" }),
    ]);
    return { admin: !!admin.data, chefe: !!chief.data };
  } catch (error) {
    // The e-mail allowlist must keep working even if the role RPC fails.
    console.error("[TV Lebara] Não foi possível verificar os cargos do utilizador.", error);
    return { admin: false, chefe: false };
  }
}

export async function resolveAdminAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  claims: unknown,
): Promise<AdminAccess> {
  const email = emailFromClaims(claims);
  const viaEmail = isAdminEmail(email);
  const flags = await roleFlags(supabase, userId);

  return {
    isAdmin: viaEmail || flags.admin || flags.chefe,
    isChefe: flags.chefe,
    email,
    viaEmail,
  };
}
