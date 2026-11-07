import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HorizonCredentials } from "@/lib/horizon";
import { completeTrial, lookupTrial, resetTrialFor } from "@/lib/horizon-trials.server";

const credentials: HorizonCredentials = {
  username: "12345678",
  password: "87654321",
  serverUrl: null,
  m3uUrl: null,
  expiresAt: null,
  planName: "Teste grátis 4h",
  connections: 1,
  isTrial: true,
};

describe("reset do teste grátis (dev)", () => {
  beforeEach(() => {
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("libera o CPF e o perfil para gerar o teste novamente", async () => {
    const userId = "33333333-3333-3333-3333-333333333333";
    const cpf = "40449664864";

    await completeTrial(null, credentials, { userId, cpf });
    expect((await lookupTrial({ userId, cpf })).status).toBe("completed");

    const result = await resetTrialFor({ userId, cpf });
    expect(result.removedMemory).toBeGreaterThan(0);

    expect((await lookupTrial({ userId, cpf })).status).toBe("none");
  });

  it("não altera o teste de outro CPF ou perfil", async () => {
    const mine = { userId: "44444444-4444-4444-4444-444444444444", cpf: "11144477735" };
    const other = { userId: "55555555-5555-5555-5555-555555555555", cpf: "52998224725" };

    await completeTrial(null, credentials, mine);
    await completeTrial(null, credentials, other);

    await resetTrialFor({ userId: mine.userId, cpf: mine.cpf });

    expect((await lookupTrial({ userId: mine.userId, cpf: mine.cpf })).status).toBe("none");
    expect((await lookupTrial({ userId: other.userId, cpf: other.cpf })).status).toBe("completed");
  });
});
