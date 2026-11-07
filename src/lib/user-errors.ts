// Client-safe helpers that keep technical details (Supabase keys, database
// migrations, internal integration names) out of customer-facing messages.
//
// The same helpers are used on the server (before returning an error to the
// browser) and on the client (before rendering an error), so a raw system
// message never reaches the end user.

export const SERVICE_UNAVAILABLE_MESSAGE =
  "Serviço temporariamente indisponível. Tente novamente em instantes.";

export class SupabaseConfigError extends Error {
  readonly code = "supabase_config";
  readonly missing: string[];

  constructor(missing: string[] = []) {
    super(SERVICE_UNAVAILABLE_MESSAGE);
    this.name = "SupabaseConfigError";
    this.missing = missing;
  }
}

const INTERNAL_HINTS = [
  "horizon",
  "xui",
  "supabase",
  "service_role",
  "service role",
  "missing supabase",
  "connect supabase",
  "migration",
  "postgres",
  "pgrst",
  "42p01",
  "bearer",
  "api devs",
  "econnrefused",
  "enotfound",
  "failed to fetch",
  "fetch failed",
  "network error",
  "networkerror",
  "internal server error",
  "stack trace",
  "http 4",
  "http 5",
  "constraint",
  "violates",
  "duplicate key",
  "permission denied",
  "row-level security",
  "invalid input syntax",
  "relation",
  "column",
];

function errorMessage(error: unknown): string {
  if (typeof error === "string") return error.trim();
  if (error instanceof Error) return (error.message ?? "").trim();
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message.trim();
  }
  return "";
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

function errorName(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const name = (error as { name?: unknown }).name;
  return typeof name === "string" ? name : "";
}

export function isServiceConfigError(error: unknown): boolean {
  if (errorCode(error) === "supabase_config") return true;
  if (errorName(error) === "SupabaseConfigError") return true;

  const lower = errorMessage(error).toLowerCase();
  return (
    lower.includes("supabase_service_role_key") ||
    lower.includes("supabase_url") ||
    lower.includes("missing supabase environment") ||
    lower.includes("connect supabase") ||
    lower.includes("service role")
  );
}

/**
 * Returns a message that is safe to show to the customer. Technical failures
 * (missing service role, database migrations, internal integration errors)
 * are replaced by the provided fallback or by a neutral availability message.
 */
export function friendlyErrorMessage(error: unknown, fallback: string): string {
  if (isServiceConfigError(error)) return SERVICE_UNAVAILABLE_MESSAGE;

  const message = errorMessage(error);
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (INTERNAL_HINTS.some((hint) => lower.includes(hint))) return fallback;

  // Avoid leaking long stack traces or JSON blobs.
  if (message.length > 240 || message.includes("\n")) return fallback;

  return message;
}
