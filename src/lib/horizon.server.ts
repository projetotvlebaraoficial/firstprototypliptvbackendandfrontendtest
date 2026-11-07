// Server-only adapter for the XUI ONE panel API.
//
// All account creation (free 4-hour trial and official post-payment accounts)
// goes straight to the XUI ONE API, with no dependency on the Horizon panel or
// on the /admin/planos mapping table. The only package used is the non-adult
// one (package id 2 = "Completo S/Adultos"), so adult content is never
// included in any account created by the site.
import {
  HORIZON_TRIAL_HOURS,
  planDisplayName,
  type HorizonCredentials,
  type HorizonSignupInput,
} from "./horizon";
import type { BillingPeriod, PlanTier } from "./site";
import { friendlyErrorMessage } from "./user-errors";

export class HorizonApiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "HorizonApiError";
    this.status = status;
  }
}

function xuiConfig() {
  const url = process.env["XUI_API_URL"]?.trim() || "http://191.96.225.102/tvlebara";
  const apiKey = process.env["XUI_API_KEY"]?.trim() || "3592FFBADD6B8BFBF3D5992199EDABE9";
  const serverUrl = process.env["XUI_SERVER_URL"]?.trim() || "http://191.96.225.102";
  const packageId = process.env["XUI_PACKAGE_ID"]?.trim() || "2";
  const groupId = process.env["XUI_GROUP_ID"]?.trim() || "2";
  if (!url || !apiKey) {
    throw new HorizonApiError(
      "A integração TV Lebara não está configurada no servidor. Tente novamente mais tarde.",
      503,
    );
  }
  return { url, apiKey, serverUrl, packageId, groupId };
}

function formatDateForXui(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function generateNumericCredentials(): { username: string; password: string } {
  const digits = "0123456789";
  let username = "";
  let password = "";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) username += digits[bytes[i]! % 10]!;
  for (let i = 0; i < 8; i++) password += digits[bytes[8 + i]! % 10]!;
  // Avoid an all-zero username/password (some panels reject it).
  if (username === "00000000") username = "10000000";
  if (password === "00000000") password = "10000000";
  return { username, password };
}

export async function xuiFetch(
  action: string,
  params: Array<[string, string]> = [],
): Promise<unknown> {
  const { url, apiKey } = xuiConfig();
  const search = new URLSearchParams([["api_key", apiKey], ["action", action], ...params]);
  const endpoint = `${url}?${search.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!response.ok) {
      throw new HorizonApiError(
        `Falha na integração TV Lebara (HTTP ${response.status}).`,
        response.status >= 400 && response.status < 500 ? response.status : 502,
      );
    }
    if (
      body &&
      typeof body === "object" &&
      (body as { status?: string }).status === "STATUS_FAILURE"
    ) {
      const err = (body as { error?: string }).error || "Falha na integração TV Lebara.";
      throw new HorizonApiError(err, 422);
    }
    return body;
  } catch (error) {
    if (error instanceof HorizonApiError) throw error;
    throw new HorizonApiError(
      friendlyErrorMessage(error, "Não foi possível concluir a operação. Tente novamente."),
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeHorizonCredentials(
  raw: unknown,
  fallback: {
    username: string;
    password: string;
    trial: boolean;
    plan: PlanTier;
    connections: number;
  },
): HorizonCredentials {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const data =
    obj["data"] && typeof obj["data"] === "object" && !Array.isArray(obj["data"])
      ? (obj["data"] as Record<string, unknown>)
      : obj;

  const { serverUrl } = xuiConfig();
  const username =
    (typeof data["username"] === "string" && data["username"].trim()) || fallback.username;
  const password =
    (typeof data["password"] === "string" && data["password"].trim()) || fallback.password;

  const expRaw = data["exp_date"];
  let expiresAt: string | null = null;
  if (typeof expRaw === "string" && expRaw.trim() && !Number.isNaN(Number(expRaw))) {
    expiresAt = new Date(Number(expRaw) * 1000).toISOString();
  } else if (typeof expRaw === "number") {
    expiresAt = new Date(expRaw * 1000).toISOString();
  } else if (typeof expRaw === "string" && expRaw.trim()) {
    const parsed = new Date(expRaw);
    if (!Number.isNaN(parsed.getTime())) expiresAt = parsed.toISOString();
  }

  const m3uUrl = `${serverUrl.replace(/\/+$/, "")}/get.php?username=${encodeURIComponent(
    username,
  )}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`;

  return {
    username,
    password,
    serverUrl,
    m3uUrl,
    expiresAt,
    planName: fallback.trial
      ? `Teste grátis ${HORIZON_TRIAL_HOURS}h`
      : planDisplayName(fallback.plan, fallback.connections),
    connections: fallback.connections,
    isTrial: fallback.trial,
  };
}

export async function createHorizonAccount(
  input: HorizonSignupInput,
  opts: { userId?: string | null; planId?: string | null } = {},
): Promise<HorizonCredentials> {
  const { packageId, groupId } = xuiConfig();
  const { username, password } = generateNumericCredentials();

  const isTrial = Boolean(input.trial);
  const connections = input.connections && input.connections > 0 ? input.connections : 1;

  const now = new Date();
  const expiry = new Date(now);
  if (isTrial) {
    expiry.setHours(expiry.getHours() + HORIZON_TRIAL_HOURS);
  } else {
    expiry.setDate(expiry.getDate() + 30);
  }
  const expDate = formatDateForXui(expiry);

  const memberId = process.env["XUI_MEMBER_ID"]?.trim() || "9309";
  // Payload idêntico ao formulário nativo de criação do painel XUI ONE:
  // bouquets_selected como string JSON de array, saídas em access_output[].
  const params: Array<[string, string]> = [
    ["group", groupId],
    ["package_id", packageId],
    ["username", username],
    ["password", password],
    ["member_id", memberId],
    ["max_connections", String(connections)],
    ["force_server_id", "0"],
    ["exp_date", expDate],
    ["bouquets_selected", JSON.stringify(["2"])],
    ["access_output[]", "1"],
    ["access_output[]", "2"],
    ["access_output[]", "3"],
  ];
  if (isTrial) params.push(["is_trial", "on"]);

  console.log("[XUI] PAYLOAD XUI:", JSON.stringify(params));

  const raw = await xuiFetch("create_line", params);
  return normalizeHorizonCredentials(raw, {
    username,
    password,
    trial: isTrial,
    plan: input.plan,
    connections,
  });
}
