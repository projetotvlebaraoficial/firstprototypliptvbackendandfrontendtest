// Authenticated server functions used by the subscriber area (/minha-conta).
// Trial generation and official credentials are both handled here; the public
// pages only create the Supabase account and redirect to /minha-conta.
//
// Every handler is defensive: a missing service role key, an unapplied
// migration or a transient network failure must never break the account page.
// When the trial status cannot be determined the UI is allowed to show the
// generation button; the generation handler validates the profile again and
// returns a friendly business message instead of a technical error.
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidCpf } from "@/lib/br";
import {
  HORIZON_TRIAL_HOURS,
  type HorizonAccountStatus,
  type HorizonCredentials,
  type HorizonTrialStatus,
} from "@/lib/horizon";
import { friendlyErrorMessage } from "@/lib/user-errors";

type ProfileRow = {
  full_name: string | null;
  cpf: string | null;
  whatsapp: string | null;
};

type ProfileLoad = {
  profile: ProfileRow | null;
  failed: boolean;
};

type ResolvedProfile = {
  full_name: string | null;
  cpf: string | null;
  whatsapp: string | null;
  failed: boolean;
};

const TRIAL_GENERIC_ERROR =
  "Não foi possível gerar o teste grátis agora. Tente novamente em instantes.";
const TRIAL_LOOKUP_FALLBACK = `Você pode gerar agora seu teste grátis de ${HORIZON_TRIAL_HOURS} horas.`;

async function loadProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileLoad> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name,cpf,whatsapp")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return { profile: (data as ProfileRow | null) ?? null, failed: false };
  } catch (error) {
    console.error("[TV Lebara] Não foi possível carregar o perfil para o teste grátis.", error);
    return { profile: null, failed: true };
  }
}

function claimMetadata(claims: unknown): Record<string, unknown> {
  if (!claims || typeof claims !== "object") return {};
  const record = claims as Record<string, unknown>;
  const metadata = record["user_metadata"];
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return record;
}

function claimString(claims: unknown, key: string): string | null {
  const value = claimMetadata(claims)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function claimEmail(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") return null;
  const value = (claims as Record<string, unknown>)["email"];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Uses the profile row as the source of truth and the Supabase user metadata
 * (filled during signup) as a fallback. This keeps the trial working even when
 * the `profiles` read fails for a transient reason.
 */
function resolveProfile(load: ProfileLoad, claims: unknown): ResolvedProfile {
  return {
    full_name: load.profile?.full_name?.trim() || claimString(claims, "full_name"),
    cpf: load.profile?.cpf?.trim() || claimString(claims, "cpf"),
    whatsapp: load.profile?.whatsapp?.trim() || claimString(claims, "whatsapp"),
    failed: load.failed,
  };
}

function normalizeCpf(raw: string | null | undefined) {
  const cpf = (raw ?? "").replace(/\D/g, "");
  return { cpf, valid: cpf.length === 11 && isValidCpf(cpf) };
}

const TRIAL_USED_FALLBACK =
  "Você já utilizou o teste grátis de 4 horas. Para continuar assistindo, assine um plano oficial.";

function trialErrorMessage(error: unknown, code: string) {
  // The trial card must never surface the generic "service unavailable"
  // message or wording about the official plan flow. Business rule violations
  // keep their own message; everything else becomes a short retry message.
  if (code === "trial_used") return friendlyErrorMessage(error, TRIAL_USED_FALLBACK);
  return TRIAL_GENERIC_ERROR;
}

function allowedStatus(): HorizonTrialStatus {
  return {
    allowed: true,
    reason: "allowed",
    message: TRIAL_LOOKUP_FALLBACK,
    trial: null,
    completedAt: null,
  };
}

export type AccountTrialResult =
  | { ok: true; credentials: HorizonCredentials; message: string }
  | { ok: false; code: string; message: string; credentials: null };

export const getAccountTrialStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HorizonTrialStatus> => {
    try {
      const load = await loadProfile(context.supabase, context.userId);
      const profile = resolveProfile(load, context.claims);
      const { cpf, valid } = normalizeCpf(profile.cpf);

      if (!valid) {
        // If the profile read itself failed, do not hide the button: let the
        // generation handler show the exact missing field instead.
        if (load.failed) return allowedStatus();
        return {
          allowed: false,
          reason: "cpf_missing",
          message: "Complete seu perfil com um CPF válido para liberar o teste grátis.",
          trial: null,
          completedAt: null,
        };
      }

      const { lookupTrial } = await import("./horizon-trials.server");
      const lookup = await lookupTrial({
        userId: context.userId,
        cpf,
        client: context.supabase,
      });

      if (lookup.status === "completed") {
        return {
          allowed: false,
          reason: "already_used",
          message:
            "Você já utilizou o teste grátis de 4 horas. Para continuar assistindo, assine um plano oficial.",
          trial: lookup.credentials,
          completedAt: lookup.row?.completed_at ?? null,
        };
      }

      if (lookup.status === "pending") {
        return {
          allowed: false,
          reason: "in_progress",
          message:
            "Seu teste grátis está sendo gerado. Aguarde alguns instantes e atualize a página.",
          trial: null,
          completedAt: null,
        };
      }

      return allowedStatus();
    } catch (error) {
      console.error("[TV Lebara] Falha ao consultar o status do teste grátis.", error);
      return allowedStatus();
    }
  });

export const requestAccountTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountTrialResult> => {
    let trialId: string | null = null;
    let cpfForCleanup: string | null = null;

    try {
      const load = await loadProfile(context.supabase, context.userId);
      const profile = resolveProfile(load, context.claims);
      const { cpf, valid } = normalizeCpf(profile.cpf);

      if (!valid) {
        return {
          ok: false,
          code: "cpf_missing",
          message: "Complete seu perfil com um CPF válido antes de gerar o teste grátis.",
          credentials: null,
        };
      }

      const name = (profile.full_name ?? "").trim();
      if (!name) {
        return {
          ok: false,
          code: "profile_incomplete",
          message: "Informe seu nome completo no perfil antes de gerar o teste grátis.",
          credentials: null,
        };
      }

      const phone = (profile.whatsapp ?? "").replace(/\D/g, "");
      if (phone.length < 10) {
        return {
          ok: false,
          code: "profile_incomplete",
          message: "Informe um WhatsApp válido no perfil antes de gerar o teste grátis.",
          credentials: null,
        };
      }

      const email = claimEmail(context.claims) ?? "";
      if (!email) {
        return {
          ok: false,
          code: "email_missing",
          message: "Sua conta não possui e-mail. Atualize o cadastro e tente novamente.",
          credentials: null,
        };
      }

      cpfForCleanup = cpf;
      const { reserveTrial, completeTrial } = await import("./horizon-trials.server");
      const { createHorizonAccount } = await import("./horizon.server");

      trialId = await reserveTrial({
        userId: context.userId,
        cpf,
        email,
        kind: "account",
      });

      const credentials = await createHorizonAccount(
        {
          name,
          email,
          phone,
          cpf,
          plan: "premium",
          device: "tv_box",
          server: "auto",
          connections: 1,
          trial: true,
        },
        { userId: context.userId },
      );

      await completeTrial(trialId, credentials, { userId: context.userId, cpf });

      return {
        ok: true,
        credentials,
        message: `Teste grátis de ${HORIZON_TRIAL_HOURS} horas gerado com sucesso.`,
      };
    } catch (error) {
      if (trialId) {
        const { releaseTrial } = await import("./horizon-trials.server");
        await releaseTrial(trialId);
      }

      const rawCode = (error as { code?: string } | null)?.code;
      const code = rawCode === "trial_used" ? "trial_used" : "error";
      const message = trialErrorMessage(error, code);

      console.error(
        `[TV Lebara] Falha ao gerar teste grátis${cpfForCleanup ? ` para CPF ${cpfForCleanup}` : ""}.`,
        error,
      );

      return { ok: false, code, message, credentials: null };
    }
  });

/** Official Horizon account status/credentials for the subscriber area. */
export const getAccountHorizonStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HorizonAccountStatus> => {
    try {
      const { getHorizonAccountStatusForUser } = await import("./horizon-accounts.server");
      return await getHorizonAccountStatusForUser(context.userId, context.supabase);
    } catch (error) {
      console.error("[TV Lebara] Falha ao consultar a conta oficial.", error);
      return {
        status: "none",
        credentials: null,
        message:
          "Sua assinatura oficial TV Lebara e credenciais de acesso serão liberadas automaticamente nesta área assim que o pagamento for confirmado.",
        error: null,
        planName: null,
        updatedAt: null,
      };
    }
  });

/**
 * Manual retry used by /minha-conta when the automatic webhook creation failed.
 * It only proceeds if the subscription is already active (payment confirmed).
 */
export const retryAccountHorizon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HorizonAccountStatus> => {
    try {
      const { retryHorizonAccountForUser } = await import("./horizon-accounts.server");
      return await retryHorizonAccountForUser(context.userId);
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
  });
