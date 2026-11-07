import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HorizonCredentials } from "@/lib/horizon";
import { completeTrial, lookupTrial, reserveTrial } from "@/lib/horizon-trials.server";

const credentials: HorizonCredentials = {
  username: "teste4864",
  password: "AbC123xYz9",
  serverUrl: "http://servidor.tvlebara.test",
  m3uUrl: null,
  expiresAt: null,
  planName: "Teste grátis 4h",
  connections: 1,
  isTrial: true,
};

describe("persistência do teste grátis em modo degradado", () => {
  beforeEach(() => {
    // The test environment intentionally has no service role key, matching the
    // scenario where Supabase is not fully configured yet.
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não lança quando o Supabase não está acessível", async () => {
    const lookup = await lookupTrial({
      userId: "11111111-1111-1111-1111-111111111111",
      cpf: "40449664864",
    });

    expect(lookup.status).toBe("none");
    expect(lookup.credentials).toBeNull();
  });

  it("continua a geração sem persistência quando a reserva falha", async () => {
    const id = await reserveTrial({
      userId: "22222222-2222-2222-2222-222222222222",
      cpf: "52998224725",
      email: "cliente@example.com",
      kind: "account",
    });

    expect(id).toBeNull();
  });

  it("mantém a regra de um teste por perfil/CPF em memória", async () => {
    const userId = "33333333-3333-3333-3333-333333333333";
    const cpf = "11144477735";

    await completeTrial(null, credentials, { userId, cpf });

    const lookup = await lookupTrial({ userId, cpf });
    expect(lookup.status).toBe("completed");
    expect(lookup.credentials?.username).toBe("teste4864");
  });
});
