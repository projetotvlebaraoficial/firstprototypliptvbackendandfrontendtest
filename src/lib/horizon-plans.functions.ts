// Admin server functions for the Horizon plan mapping panel.
//
// The mapping is stored in `horizon_plan_mappings` and read by the integration
// right before creating an account. This keeps plan IDs editable from the
// panel/database without changing code.
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  findHorizonPlanCatalogItem,
  isHorizonPlanPeriod,
  isHorizonPlanTier,
  type HorizonPlanPeriod,
  type HorizonPlanTier,
} from "@/lib/horizon-plans";
import { horizonPlanEnv } from "@/lib/horizon";
import { friendlyErrorMessage, SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/user-errors";

type MappingRow = Database["public"]["Tables"]["horizon_plan_mappings"]["Row"];

type PlanMappingList = {
  mappings: MappingRow[];
  tableReady: boolean;
  unavailable: boolean;
  message: string | null;
  env: { trial: boolean; premium: boolean; premium_plus: boolean };
};

const MAPPING_UNAVAILABLE_MESSAGE =
  "O cadastro de planos ainda não está disponível. Aplique a migration pendente no Supabase e tente novamente.";

function mappingError(error: unknown, fallback: string): Error {
  const code = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
  if (code === "42P01") return new Error(MAPPING_UNAVAILABLE_MESSAGE);
  return new Error(friendlyErrorMessage(error, fallback));
}

type SaveMappingInput = {
  planTier: string;
  billingPeriod: string;
  horizonPlanId: string;
  label?: string | null;
};

type NormalizedSaveMappingInput = {
  planTier: HorizonPlanTier;
  billingPeriod: HorizonPlanPeriod;
  horizonPlanId: string;
  label: string;
};

type DeleteMappingInput = {
  planTier: string;
  billingPeriod: string;
};

async function requireAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims: unknown;
}) {
  const { resolveAdminAccess } = await import("./admin-access.server");
  const access = await resolveAdminAccess(context.supabase, context.userId, context.claims);
  if (!access.isAdmin) throw new Error("Acesso negado");
}

function envConfigured() {
  return {
    trial: !!process.env[horizonPlanEnv.trial]?.trim(),
    premium: !!process.env[horizonPlanEnv.premium]?.trim(),
    premium_plus: !!process.env[horizonPlanEnv.premium_plus]?.trim(),
  };
}

export const listHorizonPlanMappings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlanMappingList> => {
    await requireAdmin(context);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("horizon_plan_mappings")
        .select("*")
        .order("plan_tier", { ascending: true })
        .order("billing_period", { ascending: true });

      if (error) {
        if (error.code === "42P01") {
          return {
            mappings: [],
            tableReady: false,
            unavailable: false,
            message: null,
            env: envConfigured(),
          };
        }
        throw error;
      }

      return {
        mappings: (data ?? []) as MappingRow[],
        tableReady: true,
        unavailable: false,
        message: null,
        env: envConfigured(),
      };
    } catch (error) {
      console.error("[TV Lebara] Falha ao carregar o mapeamento de planos", error);
      return {
        mappings: [],
        tableReady: false,
        unavailable: true,
        message: friendlyErrorMessage(error, SERVICE_UNAVAILABLE_MESSAGE),
        env: envConfigured(),
      };
    }
  });

export const saveHorizonPlanMapping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SaveMappingInput): NormalizedSaveMappingInput => {
    if (!input || typeof input !== "object") throw new Error("Dados inválidos");
    if (!isHorizonPlanTier(input.planTier) || !isHorizonPlanPeriod(input.billingPeriod)) {
      throw new Error("Plano ou período inválido");
    }

    const catalogItem = findHorizonPlanCatalogItem(input.planTier, input.billingPeriod);
    if (!catalogItem) throw new Error("Combinação de plano e período inválida");

    const horizonPlanId = typeof input.horizonPlanId === "string" ? input.horizonPlanId.trim() : "";
    if (!horizonPlanId) throw new Error("Informe o ID do plano no painel TV Lebara");
    if (horizonPlanId.length > 120) throw new Error("O ID deve ter no máximo 120 caracteres");
    if (
      [...horizonPlanId].some((char) => {
        const code = char.codePointAt(0) ?? 0;
        return code < 32 || code === 127;
      })
    ) {
      throw new Error("O ID do plano contém caracteres inválidos");
    }

    const label =
      typeof input.label === "string" && input.label.trim()
        ? input.label.trim().slice(0, 120)
        : catalogItem.label;

    return {
      planTier: input.planTier,
      billingPeriod: input.billingPeriod,
      horizonPlanId,
      label,
    };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: saved, error } = await supabaseAdmin
        .from("horizon_plan_mappings")
        .upsert(
          {
            plan_tier: data.planTier,
            billing_period: data.billingPeriod,
            horizon_plan_id: data.horizonPlanId,
            label: data.label,
            updated_by: context.userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "plan_tier,billing_period" },
        )
        .select("*")
        .single();

      if (error) throw error;

      try {
        await supabaseAdmin.from("admin_actions").insert({
          admin_id: context.userId,
          target_user_id: null,
          action: "update_horizon_plan_mapping",
          details: {
            planTier: data.planTier,
            billingPeriod: data.billingPeriod,
            horizonPlanId: data.horizonPlanId,
          },
        });
      } catch {
        // The mapping was saved; logging must not break the admin action.
      }

      return { ok: true, mapping: saved as MappingRow };
    } catch (error) {
      console.error("[TV Lebara] Falha ao salvar o mapeamento de planos", error);
      throw mappingError(
        error,
        "Não foi possível salvar o ID agora. Tente novamente em instantes.",
      );
    }
  });

export const deleteHorizonPlanMapping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: DeleteMappingInput): DeleteMappingInput => {
    if (!input || typeof input !== "object") throw new Error("Dados inválidos");
    if (!isHorizonPlanTier(input.planTier) || !isHorizonPlanPeriod(input.billingPeriod)) {
      throw new Error("Plano ou período inválido");
    }
    if (!findHorizonPlanCatalogItem(input.planTier, input.billingPeriod)) {
      throw new Error("Combinação de plano e período inválida");
    }
    return { planTier: input.planTier, billingPeriod: input.billingPeriod };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("horizon_plan_mappings")
        .delete()
        .eq("plan_tier", data.planTier)
        .eq("billing_period", data.billingPeriod);

      if (error) throw error;

      try {
        await supabaseAdmin.from("admin_actions").insert({
          admin_id: context.userId,
          target_user_id: null,
          action: "delete_horizon_plan_mapping",
          details: { planTier: data.planTier, billingPeriod: data.billingPeriod },
        });
      } catch {
        // Deleting the mapping succeeded; logging must not break the admin action.
      }

      return { ok: true };
    } catch (error) {
      console.error("[TV Lebara] Falha ao remover o mapeamento de planos", error);
      throw mappingError(
        error,
        "Não foi possível remover o mapeamento agora. Tente novamente em instantes.",
      );
    }
  });
