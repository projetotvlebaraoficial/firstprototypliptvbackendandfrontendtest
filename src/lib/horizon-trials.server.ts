// Server-only persistence for the once-per-profile / once-per-CPF trial rule.
//
// Rows are written with the service role because the public trial route has no
// session. The unique indexes in the `horizon_trials` migration are the real
// enforcement; the lookups here only provide friendly messages and clean up
// abandoned attempts.
//
// Resilience: the subscriber area must render even when the service role key
// is missing or the migrations have not been applied yet. Every database access
// below is best-effort: reads fall back to the authenticated client (RLS lets
// the subscriber read their own row), and writes simply skip persistence when
// Supabase is unavailable. A small in-process cache keeps the "one trial per
// profile/CPF" rule while the database is offline.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import type { HorizonCredentials } from "./horizon";

export type HorizonTrialRow = Database["public"]["Tables"]["horizon_trials"]["Row"];
export type HorizonTrialKind = "public" | "account";

export type TrialLookup = {
  status: "none" | "completed" | "pending";
  row: HorizonTrialRow | null;
  credentials: HorizonCredentials | null;
};

type Client = SupabaseClient<Database>;

const STALE_PENDING_MS = 15 * 60 * 1000;
const MEMORY_LIMIT = 500;

type MemoryTrial = {
  userId: string | null;
  cpf: string;
  credentials: HorizonCredentials;
  completedAt: string;
};

// Best-effort lock used only when the database cannot be reached. It is not a
// replacement for the unique indexes; it just prevents repeated clicks in the
// same server process during an outage.
const memoryTrials: MemoryTrial[] = [];

export class TrialAlreadyUsedError extends Error {
  readonly code = "trial_used";

  constructor(message: string) {
    super(message);
    this.name = "TrialAlreadyUsedError";
  }
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function isStale(row: HorizonTrialRow) {
  const created = new Date(row.created_at).getTime();
  return Number.isFinite(created) && Date.now() - created > STALE_PENDING_MS;
}

type AdminHandle = { client: Client };

async function adminClient(): Promise<AdminHandle | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin as unknown as Client;
    // Touch a property inside the try so a missing service role is caught here
    // instead of at the call site. Returning the proxy directly from an async
    // function would also trigger its `get` trap when the promise resolves
    // (`then` lookup), so it is wrapped in a plain object.
    if (typeof client.from !== "function") return null;
    return { client };
  } catch (error) {
    console.error("[TV Lebara] Service role indisponível para o teste grátis.", error);
    return null;
  }
}

function logLookupError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01") {
    console.error(
      "[TV Lebara] Tabela de testes ausente. Aplique a migration 20261105120000_horizon_trials.sql no Supabase.",
    );
    return;
  }
  console.error("[TV Lebara] Não foi possível consultar o teste grátis.", error);
}

async function queryRows(client: Client, userId: string | null | undefined, cpf: string) {
  const rows: HorizonTrialRow[] = [];

  if (userId) {
    const { data, error } = await client
      .from("horizon_trials")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data) rows.push(data);
  }

  if (cpf) {
    const { data, error } = await client
      .from("horizon_trials")
      .select("*")
      .eq("cpf", cpf)
      .maybeSingle();
    if (error) throw error;
    if (data && !rows.some((row) => row.id === data.id)) rows.push(data);
  }

  return rows;
}

/**
 * Returns the rows for this profile/CPF, or `null` when neither the service
 * role nor the authenticated client could reach the table. `null` means
 * "unknown" and is handled optimistically by the callers so the UI never
 * blocks on infrastructure.
 */
async function findRows(
  userId: string | null | undefined,
  cpf: string,
  fallback?: Client | null,
): Promise<HorizonTrialRow[] | null> {
  const admin = await adminClient();
  if (admin) {
    try {
      return await queryRows(admin.client, userId, cpf);
    } catch (error) {
      logLookupError(error);
    }
  }

  if (fallback) {
    try {
      return await queryRows(fallback, userId, cpf);
    } catch (error) {
      logLookupError(error);
    }
  }

  return null;
}

function rememberCompletedTrial(trial: MemoryTrial) {
  if (memoryTrials.length >= MEMORY_LIMIT) memoryTrials.shift();
  memoryTrials.push(trial);
}

function findMemoryTrial(userId: string | null | undefined, cpf: string): MemoryTrial | null {
  const normalized = digits(cpf);
  return (
    memoryTrials.find(
      (trial) =>
        (Boolean(userId) && trial.userId === userId) ||
        (Boolean(normalized) && trial.cpf === normalized),
    ) ?? null
  );
}

export async function resetTrialFor({
  userId,
  cpf,
}: {
  userId?: string | null;
  cpf?: string | null;
}): Promise<{ removedMemory: number; removedDb: number }> {
  const normalized = digits(cpf ?? "");
  let removedMemory = 0;
  for (let index = memoryTrials.length - 1; index >= 0; index--) {
    const trial = memoryTrials[index];
    if (!trial) continue;
    if ((userId && trial.userId === userId) || (normalized && trial.cpf === normalized)) {
      memoryTrials.splice(index, 1);
      removedMemory++;
    }
  }

  let removedDb = 0;
  const admin = await adminClient();
  if (admin) {
    try {
      if (userId) {
        const { error, count } = await admin.client
          .from("horizon_trials")
          .delete({ count: "exact" })
          .eq("user_id", userId);
        if (error) throw error;
        removedDb += count ?? 0;
      }
      if (normalized) {
        const { error, count } = await admin.client
          .from("horizon_trials")
          .delete({ count: "exact" })
          .eq("cpf", normalized);
        if (error) throw error;
        removedDb += count ?? 0;
      }
    } catch (error) {
      console.error("[TV Lebara][dev] Não foi possível limpar o teste grátis no banco.", error);
    }
  }

  return { removedMemory, removedDb };
}

export async function releaseTrial(id: string) {
  const admin = await adminClient();
  if (!admin) return;

  try {
    const { error } = await admin.client.from("horizon_trials").delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("[TV Lebara] Não foi possível liberar a reserva do teste grátis.", error);
  }
}

export async function lookupTrial({
  userId,
  cpf,
  client,
}: {
  userId?: string | null;
  cpf: string;
  client?: Client | null;
}): Promise<TrialLookup> {
  const normalized = digits(cpf);
  const rows = await findRows(userId, normalized, client);

  if (rows) {
    const completed = rows.find((row) => row.status === "completed");
    if (completed) {
      return {
        status: "completed",
        row: completed,
        credentials: trialRowToCredentials(completed),
      };
    }

    const pending = rows.find((row) => row.status === "pending" && !isStale(row));
    if (pending) return { status: "pending", row: pending, credentials: null };

    // Abandoned attempts (server crash, timeout before release) must not lock
    // the CPF forever. Delete them so the customer can try again.
    for (const row of rows) {
      if (row.status === "pending" && isStale(row)) {
        await releaseTrial(row.id);
      }
    }
  }

  // The database was unreachable (or had no row) but this process already
  // generated a trial: keep the rule until persistence is available again.
  const memory = findMemoryTrial(userId, normalized);
  if (memory) {
    return { status: "completed", row: null, credentials: memory.credentials };
  }

  return { status: "none", row: null, credentials: null };
}

/**
 * Reserves the trial before calling the API. Returns `null` when Supabase is
 * unavailable so the generation can still proceed in degraded mode.
 */
export async function reserveTrial({
  userId,
  cpf,
  email,
  kind,
}: {
  userId?: string | null;
  cpf: string;
  email?: string | null;
  kind: HorizonTrialKind;
}): Promise<string | null> {
  const normalized = digits(cpf);
  if (normalized.length !== 11) throw new Error("CPF inválido para o teste grátis.");

  const lookup = await lookupTrial({ userId: userId ?? null, cpf: normalized });
  if (lookup.status === "completed") {
    throw new TrialAlreadyUsedError(
      "Você já utilizou o teste grátis de 4 horas. Para continuar, assine um plano oficial.",
    );
  }
  if (lookup.status === "pending") {
    throw new TrialAlreadyUsedError(
      "Já existe um teste grátis sendo gerado para este perfil ou CPF. Aguarde alguns instantes e tente novamente.",
    );
  }

  const admin = await adminClient();
  if (!admin) {
    console.error(
      "[TV Lebara] Teste grátis sem persistência: service role indisponível. A geração seguirá em modo degradado.",
    );
    return null;
  }

  try {
    const { data, error } = await admin.client
      .from("horizon_trials")
      .insert({
        user_id: userId ?? null,
        cpf: normalized,
        email: email ?? null,
        kind,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new TrialAlreadyUsedError(
          "Este CPF ou perfil já utilizou o teste grátis. Assine um plano oficial para continuar.",
        );
      }
      if (error.code === "42P01") {
        console.error(
          "[TV Lebara] Tabela de testes ausente. Aplique a migration 20261105120000_horizon_trials.sql no Supabase.",
        );
        return null;
      }
      throw new Error("Não foi possível registrar o teste grátis. Tente novamente.");
    }

    return data.id;
  } catch (error) {
    if (error instanceof TrialAlreadyUsedError) throw error;
    console.error(
      "[TV Lebara] Falha ao reservar o teste grátis; seguindo sem persistência.",
      error,
    );
    return null;
  }
}

export async function completeTrial(
  id: string | null,
  credentials: HorizonCredentials,
  meta?: { userId?: string | null; cpf?: string | null },
) {
  const completedAt = new Date().toISOString();
  const normalizedCpf = digits(meta?.cpf ?? "");

  if (normalizedCpf) {
    rememberCompletedTrial({
      userId: meta?.userId ?? null,
      cpf: normalizedCpf,
      credentials,
      completedAt,
    });
  }

  if (!id) return;

  const admin = await adminClient();
  if (!admin) return;

  try {
    const { error } = await admin.client
      .from("horizon_trials")
      .update({
        status: "completed",
        username: credentials.username,
        password: credentials.password,
        server_url: credentials.serverUrl,
        m3u_url: credentials.m3uUrl,
        plan: credentials.planName,
        connections: credentials.connections,
        credentials: credentials as unknown as Json,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error(
      "[TV Lebara] Credenciais geradas, mas o teste não pôde ser salvo no banco.",
      error,
    );
  }
}

function storedString(row: HorizonTrialRow, key: string) {
  const stored = row.credentials;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  const value = (stored as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function storedNumber(row: HorizonTrialRow, key: string) {
  const stored = row.credentials;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  const value = (stored as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function trialRowToCredentials(row: HorizonTrialRow | null): HorizonCredentials | null {
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
    isTrial: true,
  };
}
