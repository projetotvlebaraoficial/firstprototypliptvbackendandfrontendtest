// Shared catalog of every plan combination the site can sell. The admin panel
// uses it to render all rows (even unmapped ones) and the server uses the same
// keys when resolving the Horizon plan ID.
import { HORIZON_TRIAL_HOURS, horizonPlanEnv } from "./horizon";
import { periods, tiers, type BillingPeriod, type PlanTier } from "./site";

export type HorizonPlanTier = PlanTier | "trial";
export type HorizonPlanPeriod = BillingPeriod | "trial";

export type HorizonPlanCatalogItem = {
  planTier: HorizonPlanTier;
  billingPeriod: HorizonPlanPeriod;
  label: string;
  group: string;
};

export const horizonPlanCatalog: HorizonPlanCatalogItem[] = [
  ...(Object.keys(tiers) as PlanTier[]).flatMap((tier) =>
    periods.map((period) => ({
      planTier: tier as HorizonPlanTier,
      billingPeriod: period.value as HorizonPlanPeriod,
      label: `${tiers[tier].name} ${period.label}`,
      group: tiers[tier].name,
    })),
  ),
  {
    planTier: "trial",
    billingPeriod: "trial",
    label: `Teste grátis ${HORIZON_TRIAL_HOURS} horas`,
    group: "Teste grátis",
  },
];

export function isHorizonPlanTier(value: unknown): value is HorizonPlanTier {
  return value === "premium" || value === "premium_plus" || value === "trial";
}

export function isHorizonPlanPeriod(value: unknown): value is HorizonPlanPeriod {
  return (
    value === "mensal" ||
    value === "trimestral" ||
    value === "semestral" ||
    value === "anual" ||
    value === "trial"
  );
}

export function horizonPlanKey(tier: HorizonPlanTier, period: HorizonPlanPeriod) {
  return `${tier}:${period}`;
}

export function findHorizonPlanCatalogItem(
  tier: HorizonPlanTier,
  period: HorizonPlanPeriod,
): HorizonPlanCatalogItem | null {
  return (
    horizonPlanCatalog.find((item) => item.planTier === tier && item.billingPeriod === period) ??
    null
  );
}

export function horizonPlanLabel(tier: HorizonPlanTier, period: HorizonPlanPeriod) {
  return findHorizonPlanCatalogItem(tier, period)?.label ?? `${tier} ${period}`;
}

export function horizonPlanEnvKey(tier: HorizonPlanTier) {
  return tier === "trial" ? horizonPlanEnv.trial : horizonPlanEnv[tier];
}
