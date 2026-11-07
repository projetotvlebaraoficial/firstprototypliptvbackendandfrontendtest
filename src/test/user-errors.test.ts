import { describe, expect, it } from "vitest";
import {
  friendlyErrorMessage,
  isServiceConfigError,
  SERVICE_UNAVAILABLE_MESSAGE,
  SupabaseConfigError,
} from "@/lib/user-errors";

describe("mensagens amigáveis ao cliente", () => {
  it("substitui a falta da service role por uma mensagem neutra", () => {
    const error = new SupabaseConfigError(["SUPABASE_SERVICE_ROLE_KEY"]);
    expect(isServiceConfigError(error)).toBe(true);
    expect(friendlyErrorMessage(error, "fallback")).toBe(SERVICE_UNAVAILABLE_MESSAGE);
  });

  it("reconhece o erro mesmo depois de serializado", () => {
    const error = new Error("Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY");
    expect(isServiceConfigError(error)).toBe(true);
    expect(friendlyErrorMessage(error, "fallback")).toBe(SERVICE_UNAVAILABLE_MESSAGE);
  });

  it("esconde detalhes internos de integração e banco", () => {
    expect(friendlyErrorMessage(new Error("Horizon API devs retornou HTTP 500"), "fallback")).toBe(
      "fallback",
    );
    expect(
      friendlyErrorMessage(new Error('relation "horizon_accounts" does not exist'), "fallback"),
    ).toBe("fallback");
  });

  it("mantém mensagens de negócio curtas", () => {
    expect(friendlyErrorMessage(new Error("Complete seu CPF no perfil."), "fallback")).toBe(
      "Complete seu CPF no perfil.",
    );
  });

  it("usa o fallback quando não há mensagem", () => {
    expect(friendlyErrorMessage(null, "fallback")).toBe("fallback");
    expect(friendlyErrorMessage({}, "fallback")).toBe("fallback");
  });
});
