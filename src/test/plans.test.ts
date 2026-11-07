import { describe, expect, it } from "vitest";
import { tiers, priceCents, TEST_MODE } from "@/lib/site";

describe("planos", () => {
  it("guarda os preços reais do Premium (1 TV)", () => {
    expect(tiers.premium.realPriceCents).toEqual({ mensal: 3000, trimestral: 9000, semestral: 18000, anual: 36000 });
    expect(tiers.premium.tvs).toBe(1);
  });
  it("guarda os preços reais do Premium Plus (3 TVs)", () => {
    expect(tiers.premium_plus.realPriceCents).toEqual({ mensal: 6000, trimestral: 18000, semestral: 36000, anual: 72900 });
    expect(tiers.premium_plus.tvs).toBe(3);
  });
  it("cobra os valores oficiais", () => {
    expect(TEST_MODE).toBe(false); expect(priceCents("premium_plus", "anual")).toBe(72900); expect(priceCents("premium", "mensal")).toBe(3000);
  });
});
