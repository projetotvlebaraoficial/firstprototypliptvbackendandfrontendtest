// Development-only helper: clears the trial status of the signed-in user so the
// "Gerar teste grátis" flow can be tested again without opening the Supabase
// dashboard. It is blocked in production builds and only touches the current
// user's own trial rows (by profile id and by CPF).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const resetAccountTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("Disponível apenas em ambiente de desenvolvimento.");
    }

    const { data } = await context.supabase
      .from("profiles")
      .select("cpf")
      .eq("id", context.userId)
      .maybeSingle();
    const cpf = (data?.cpf ?? "").replace(/\D/g, "");

    const { resetTrialFor } = await import("./horizon-trials.server");
    const result = await resetTrialFor({ userId: context.userId, cpf });
    console.info("[TV Lebara][dev] Teste grátis resetado para o utilizador atual.", result);
    return { ok: true, ...result };
  });
