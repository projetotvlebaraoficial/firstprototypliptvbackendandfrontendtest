// Shared Horizon (IPTV panel) types and options.
//
// This module is imported by both the browser and the server, so it must stay
// free of Node-only APIs and secrets. The actual HTTP calls live in
// `horizon.server.ts`.
import type { BillingPeriod, PlanTier } from "@/lib/site";

export const HORIZON_TRIAL_HOURS = 4;

/**
 * Device labels are sent to the Horizon API as `device`. Keep the values
 * stable; the label is what the customer sees.
 */
export const horizonDevices = [
  { value: "tv_box", label: "TV Box / Android TV" },
  { value: "smart_tv", label: "Smart TV" },
  { value: "celular", label: "Celular / Tablet" },
  { value: "computador", label: "Computador" },
  { value: "outro", label: "Outro dispositivo" },
] as const;

/**
 * Server labels are sent as `server` / `server_id`. If your Horizon panel
 * exposes different identifiers, change the values here (or override them
 * through the payload builder in `horizon.server.ts`).
 */
export const horizonServers = [
  { value: "auto", label: "Automático (recomendado)" },
  { value: "servidor-01", label: "Servidor 01" },
  { value: "servidor-02", label: "Servidor 02" },
] as const;

export type HorizonDevice = (typeof horizonDevices)[number]["value"];
export type HorizonServer = (typeof horizonServers)[number]["value"];

export type HorizonSignupInput = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  plan: PlanTier;
  /** Billing period of the purchased plan. Omitted for the free trial. */
  period?: BillingPeriod | null;
  device: string;
  server: string;
  connections: number;
  trial: boolean;
};

export type HorizonCredentials = {
  username: string;
  password: string;
  serverUrl: string | null;
  m3uUrl: string | null;
  expiresAt: string | null;
  planName: string | null;
  connections: number | null;
  isTrial: boolean;
};

export type HorizonTrialReason =
  "allowed" | "already_used" | "in_progress" | "cpf_missing" | "cpf_invalid";

export type HorizonTrialStatus = {
  allowed: boolean;
  reason: HorizonTrialReason;
  message: string;
  trial: HorizonCredentials | null;
  completedAt: string | null;
};

/**
 * Status of the official Horizon account. Credentials only exist after the
 * payment gateway confirms the payment and the webhook creates the account.
 */
export type HorizonAccountStatus = {
  status: "none" | "pending" | "active" | "failed";
  credentials: HorizonCredentials | null;
  message: string;
  error: string | null;
  planName: string | null;
  updatedAt: string | null;
};

export function planDisplayName(plan: PlanTier, connections: number) {
  const base = plan === "premium_plus" ? "Premium Plus" : "Premium";
  return connections > 1 ? `${base} · ${connections} telas` : `${base} · 1 tela`;
}

/**
 * Environment variables that map each site tier to the exact plan ID created
 * in the Horizon panel. The same IDs are used for trial and official plans.
 */
export const horizonPlanEnv = {
  trial: "HORIZON_TRIAL_PLAN",
  premium: "HORIZON_PLAN_PREMIUM",
  premium_plus: "HORIZON_PLAN_PREMIUM_PLUS",
} as const;
