// Server-only persistence for official Horizon accounts.
//
// Official credentials are NEVER created before payment. The Mercado Pago
// webhook calls `ensureHorizonAccountForUser` only after the gateway confirms
// an approved payment. The unique index on `horizon_accounts.user_id` and the
// status checks below make the webhook idempotent.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isValidCpf } from "./br";
import {
  planDisplayName,
  type HorizonAccountStatus,
  type HorizonCredentials,
  type HorizonSignupInput,
} from "./horizon";
import { isPeriod, isTier, type BillingPeriod, type PlanTier } from "./site";
import { friendlyErrorMessage } from "./user-errors";

export type HorizonAccountRow = Database["public"]["Tables"]["horizon_accounts"]["Row"];

/** Do not hammer the Horizon API while a creation attempt is still running. */
const PENDING_STALE_MS = 5 * 60 * 1000;
/** After a failure, wait a little before the next automatic/webhook retry. */
const FAILED_RETRY_MS = 2 * 60 * 1000;

function isOlderThan(iso: string | null | undefined, ms: number) {
  if (!iso) return true;
  const time = new Date(iso).getTime();
  return !Number.isFinite(time) || Date.now() - time > ms;
}

function storedString(row: HorizonAccountRow, key: string) {
  const stored = row.credentials;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  const value = (stored as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function storedNumber(row: HorizonAccountRow, key: string) {
  const stored = row.credentials;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  const value = (stored as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function accountRowToCredentials(row: HorizonAccountRow | null): HorizonCredentials | null {
  if (!row) return null;
  const username = row.username ?? storedString(row, "username");
  const password = row.password ?? storedString(row, "password");
  if (!username || !password) return null;

  return {
    username,
    password,
    serverUrl: row.server_url ?? storedString(row, "serverUrl"),
    m3uUrl: row.m3u_url ?? storedString(row, "m3uUrl"),
    expiresAt: storedString(row, "expiresAt"),
    planName: row.plan ?? storedString(row, "planName"),
    connections: row.connections ?? storedNumber(row, "connections"),
    isTrial: false,
  };
}

export function accountRowToStatus(row: HorizonAccountRow | null): HorizonAccountStatus {
  if (!row) {
    return {
      status: "none",
      credentials: null,
      message:
        "Nenhuma conta oficial foi gerada ainda. As credenciais são liberadas após a confirmação do pagamento.",
      error: null,
      planName: null,
      updatedAt: null,
    };
  }

  const credentials = row.status === "active" ? accountRowToCredentials(row) : null;

  if (row.status === "active" && credentials) {
    return {
      status: "active",
      credentials,
      message: "Conta oficial ativa. Use as credenciais abaixo para assistir.",
      error: null,
      planName: row.plan ?? credentials.planName,
      updatedAt: row.updated_at,
    };
  }

  if (row.status === "failed") {
    return {
      status: "failed",
      credentials: null,
      message: friendlyErrorMessage(
        row.error,
        "Não foi possível criar sua conta oficial TV Lebara. Nossa equipe já foi avisada; você pode tentar novamente.",
      ),
      error: row.error,
      planName: row.plan,
      updatedAt: row.updated_at,
    };
  }

  return {
    status: "pending",
    credentials: null,
    message: "Pagamento confirmado! Estamos preparando sua conta oficial TV Lebara.",
    error: null,
    planName: row.plan,
    updatedAt: row.updated_at,
  };
}

export async function getHorizonAccountRow(
  userId: string,
  fallback?: SupabaseClient<Database> | null,
): Promise<HorizonAccountRow | null> {
  // Try the service role first. If it is not configured (or the table has not
  // been migrated yet), fall back to the subscriber's own client. RLS allows
  // the user to read their own account row.
  try {
    const { data, error } = await supabaseAdmin
      .from("horizon_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "42P01") {
      console.error(
        "[TV Lebara] Tabela de contas oficiais ausente. Aplique a migration 20261105130000_horizon_accounts.sql no Supabase.",
      );
    } else {
      console.error("[TV Lebara] Não foi possível consultar a conta oficial.", error);
    }
  }

  if (!fallback) return null;

  try {
    const { data, error } = await fallback
      .from("horizon_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[TV Lebara] Fallback da conta oficial também falhou.", error);
    return null;
  }
}

export async function getHorizonAccountStatusForUser(
  userId: string,
  fallback?: SupabaseClient<Database> | null,
): Promise<HorizonAccountStatus> {
  return accountRowToStatus(await getHorizonAccountRow(userId, fallback));
}

async function loadProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("full_name,cpf,whatsapp")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadEmail(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) return "";
    return data.user?.email ?? "";
  } catch {
    return "";
  }
}

async function subscriptionPlan(userId: string) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status,plan_tier,billing_period,pending_tier,pending_period")
    .eq("user_id", userId)
    .maybeSingle();
  const tier = isTier(data?.plan_tier)
    ? data.plan_tier
    : isTier(data?.pending_tier)
      ? data.pending_tier
      : null;
  const period = isPeriod(data?.billing_period)
    ? data.billing_period
    : isPeriod(data?.pending_period)
      ? data.pending_period
      : null;
  return { subscription: data, tier, period };
}

async function markFailed(rowId: string, message: string): Promise<HorizonAccountRow> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("horizon_accounts")
    .update({ status: "failed", error: message, updated_at: now })
    .eq("id", rowId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(message);
  }
  return data;
}

export type EnsureHorizonAccountInput = {
  userId: string;
  tier?: PlanTier | string | null;
  period?: BillingPeriod | string | null;
  paymentId?: string | null;
};

/**
 * Creates the official Horizon account for a subscriber. Safe to call multiple
 * times: an active account is returned as-is, and a recent pending attempt is
 * not duplicated.
 */
export async function ensureHorizonAccountForUser({
  userId,
  tier,
  period,
  paymentId,
}: EnsureHorizonAccountInput): Promise<HorizonAccountStatus> {
  let row = await getHorizonAccountRow(userId);

  if (row?.status === "active") return accountRowToStatus(row);
  if (row?.status === "pending" && !isOlderThan(row.updated_at, PENDING_STALE_MS)) {
    return accountRowToStatus(row);
  }
  if (row?.status === "failed" && !isOlderThan(row.updated_at, FAILED_RETRY_MS)) {
    return accountRowToStatus(row);
  }

  const fallback = await subscriptionPlan(userId);
  const resolvedTier: PlanTier = isTier(tier) ? tier : (fallback.tier ?? "premium");
  const resolvedPeriod: BillingPeriod = isPeriod(period) ? period : (fallback.period ?? "mensal");

  const now = new Date().toISOString();

  if (!row) {
    const { data, error } = await supabaseAdmin
      .from("horizon_accounts")
      .insert({
        user_id: userId,
        status: "pending",
        plan_tier: resolvedTier,
        billing_period: resolvedPeriod,
        provider_payment_id: paymentId ?? null,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        // Another webhook call created the row first.
        row = await getHorizonAccountRow(userId);
        if (row?.status === "active") return accountRowToStatus(row);
        if (!row) throw new Error("Não foi possível registrar a conta oficial.");
      } else if (error.code === "42P01") {
        console.error(
          "[TV Lebara] Tabela de contas oficiais ausente. Aplique a migration 20261105130000_horizon_accounts.sql no Supabase.",
        );
        throw new Error(
          "Seu acesso oficial ainda não está disponível. Tente novamente em instantes.",
        );
      } else {
        throw error;
      }
    } else {
      row = data;
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from("horizon_accounts")
      .update({
        status: "pending",
        error: null,
        plan_tier: resolvedTier,
        billing_period: resolvedPeriod,
        provider_payment_id: paymentId ?? row.provider_payment_id,
        updated_at: now,
      })
      .eq("id", row.id)
      .select("*")
      .single();
    if (error || !data) throw error ?? new Error("Não foi possível atualizar a conta oficial.");
    row = data;
  }

  if (!row) throw new Error("Não foi possível registrar a conta oficial.");

  try {
    const profile = await loadProfile(userId);
    const name = (profile?.full_name ?? "").trim();
    if (name.length < 3) {
      return accountRowToStatus(
        await markFailed(
          row.id,
          "Complete seu nome no perfil para liberarmos sua conta oficial TV Lebara.",
        ),
      );
    }

    const cpf = (profile?.cpf ?? "").replace(/\D/g, "");
    if (cpf.length !== 11 || !isValidCpf(cpf)) {
      return accountRowToStatus(
        await markFailed(
          row.id,
          "Complete seu CPF no perfil para liberarmos sua conta oficial TV Lebara.",
        ),
      );
    }

    const phone = (profile?.whatsapp ?? "").replace(/\D/g, "");
    if (phone.length < 10) {
      return accountRowToStatus(
        await markFailed(
          row.id,
          "Complete seu WhatsApp no perfil para liberarmos sua conta oficial TV Lebara.",
        ),
      );
    }

    const email = await loadEmail(userId);
    if (!email) {
      return accountRowToStatus(
        await markFailed(
          row.id,
          "Sua conta não possui e-mail válido para criar o acesso TV Lebara.",
        ),
      );
    }

    const { createHorizonAccount } = await import("./horizon.server");
    const connections = resolvedTier === "premium_plus" ? 3 : 1;

    const input: HorizonSignupInput = {
      name,
      email,
      phone,
      cpf,
      plan: resolvedTier,
      period: resolvedPeriod,
      device: "tv_box",
      server: "auto",
      connections,
      trial: false,
    };

    const credentials = await createHorizonAccount(input, { userId });

    const activatedAt = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("horizon_accounts")
      .update({
        status: "active",
        username: credentials.username,
        password: credentials.password,
        server_url: credentials.serverUrl,
        m3u_url: credentials.m3uUrl,
        plan: credentials.planName ?? planDisplayName(resolvedTier, connections),
        plan_id: null,
        plan_tier: resolvedTier,
        billing_period: resolvedPeriod,
        connections: credentials.connections ?? connections,
        credentials: credentials as unknown as Json,
        error: null,
        activated_at: activatedAt,
        updated_at: activatedAt,
      })
      .eq("id", row.id)
      .select("*")
      .single();

    if (error || !data)
      throw error ?? new Error("Conta criada, mas não foi possível salvar as credenciais.");
    return accountRowToStatus(data);
  } catch (error) {
    const message = friendlyErrorMessage(
      error,
      "Não foi possível criar sua conta oficial TV Lebara. Tente novamente em instantes.",
    );
    try {
      return accountRowToStatus(await markFailed(row.id, message));
    } catch {
      return {
        status: "failed",
        credentials: null,
        message,
        error: message,
        planName: null,
        updatedAt: null,
      };
    }
  }
}

/**
 * Authenticated retry. Only creates the Horizon account when the subscription
 * is already active (i.e. the gateway confirmed a payment).
 */
export async function retryHorizonAccountForUser(userId: string): Promise<HorizonAccountStatus> {
  try {
    const { subscription, tier, period } = await subscriptionPlan(userId);
    if (subscription?.status !== "ativa") {
      return {
        status: "none",
        credentials: null,
        message:
          "Nenhum pagamento confirmado ainda. Assim que o gateway aprovar, as credenciais são liberadas automaticamente.",
        error: null,
        planName: null,
        updatedAt: null,
      };
    }

    return ensureHorizonAccountForUser({ userId, tier, period });
  } catch (error) {
    console.error("[TV Lebara] Falha ao liberar a conta oficial.", error);
    return {
      status: "none",
      credentials: null,
      message: "Não foi possível liberar suas credenciais agora. Tente novamente em instantes.",
      error: null,
      planName: null,
      updatedAt: null,
    };
  }
}
