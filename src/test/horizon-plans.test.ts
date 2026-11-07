import { describe, expect, it } from "vitest";
import { periods, tiers, type PlanTier } from "@/lib/site";
import {
  findHorizonPlanCatalogItem,
  horizonPlanCatalog,
  horizonPlanKey,
  horizonPlanLabel,
} from "@/lib/horizon-plans";

describe("mapeamento de planos oficiais TV Lebara", () => {
  it("lista todos os planos oficiais em todos os períodos", () => {
    for (const tier of Object.keys(tiers) as PlanTier[]) {
      for (const period of periods) {
        expect(findHorizonPlanCatalogItem(tier, period.value)).not.toBeNull();
      }
    }
  });

  it("inclui o teste grátis como uma linha própria", () => {
    expect(findHorizonPlanCatalogItem("trial", "trial")?.label).toContain("Teste grátis");
    expect(horizonPlanCatalog).toHaveLength(Object.keys(tiers).length * periods.length + 1);
  });

  it("usa uma chave estável por plano e período", () => {
    expect(horizonPlanKey("premium_plus", "anual")).toBe("premium_plus:anual");
    expect(horizonPlanLabel("premium", "mensal")).toBe("Premium Mensal");
  });
});
