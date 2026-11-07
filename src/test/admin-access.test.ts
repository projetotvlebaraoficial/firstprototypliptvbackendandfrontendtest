import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  emailFromClaims,
  isAdminEmail,
  parseAdminEmails,
  resolveAdminAccess,
} from "@/lib/admin-access.server";

function fakeSupabase(roles: { admin: boolean; chefe: boolean }): SupabaseClient<Database> {
  return {
    rpc: vi.fn(async (_fn: string, args: { _role: string }) =>
      args._role === "admin_chefe"
        ? { data: roles.chefe, error: null }
        : { data: roles.admin, error: null },
    ),
  } as unknown as SupabaseClient<Database>;
}

describe("lista de administradores por e-mail", () => {
  const original = process.env["ADMIN_EMAILS"];

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (original === undefined) delete process.env["ADMIN_EMAILS"];
    else process.env["ADMIN_EMAILS"] = original;
  });

  it("normaliza vírgulas, ponto e vírgula, espaços e maiúsculas", () => {
    expect(parseAdminEmails(" Admin@TV.com, outro@tv.com;terceiro@tv.com  quarto@tv.com ")).toEqual(
      ["admin@tv.com", "outro@tv.com", "terceiro@tv.com", "quarto@tv.com"],
    );
  });

  it("ignora entradas inválidas e duplicadas", () => {
    expect(parseAdminEmails("sem-arroba, ,admin@tv.com, ADMIN@tv.com")).toEqual(["admin@tv.com"]);
    expect(parseAdminEmails("")).toEqual([]);
    expect(parseAdminEmails(undefined)).toEqual([]);
  });

  it("lê o e-mail do utilizador a partir das claims", () => {
    expect(emailFromClaims({ email: "Admin@TV.com" })).toBe("admin@tv.com");
    expect(emailFromClaims({ user_metadata: { email: "Nested@TV.com" } })).toBe("nested@tv.com");
    expect(emailFromClaims({})).toBeNull();
    expect(emailFromClaims(null)).toBeNull();
  });

  it("reconhece o e-mail autorizado sem diferenciar maiúsculas", () => {
    process.env["ADMIN_EMAILS"] = "stsvini191@gmail.com";
    expect(isAdminEmail("STSVINI191@gmail.com")).toBe(true);
    expect(isAdminEmail("outra@gmail.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it("libera o acesso apenas pelo e-mail, sem papel no Supabase", async () => {
    process.env["ADMIN_EMAILS"] = "stsvini191@gmail.com";
    const access = await resolveAdminAccess(
      fakeSupabase({ admin: false, chefe: false }),
      "user-1",
      { email: "stsvini191@gmail.com" },
    );

    expect(access).toMatchObject({
      isAdmin: true,
      isChefe: false,
      viaEmail: true,
      email: "stsvini191@gmail.com",
    });
  });

  it("mantém o acesso dos administradores por papel como fallback", async () => {
    process.env["ADMIN_EMAILS"] = "";
    const access = await resolveAdminAccess(fakeSupabase({ admin: false, chefe: true }), "user-2", {
      email: "chefe@tv.com",
    });

    expect(access.isAdmin).toBe(true);
    expect(access.isChefe).toBe(true);
    expect(access.viaEmail).toBe(false);
  });

  it("continua a autorizar por e-mail mesmo se a verificação de papéis falhar", async () => {
    process.env["ADMIN_EMAILS"] = "stsvini191@gmail.com";
    const supabase = {
      rpc: vi.fn(async () => {
        throw new Error("RPC indisponível");
      }),
    } as unknown as SupabaseClient<Database>;

    const access = await resolveAdminAccess(supabase, "user-3", {
      email: "stsvini191@gmail.com",
    });

    expect(access.isAdmin).toBe(true);
    expect(access.viaEmail).toBe(true);
  });
});
