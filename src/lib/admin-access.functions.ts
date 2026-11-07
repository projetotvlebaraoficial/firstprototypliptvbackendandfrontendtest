// Server function used by the client to know whether the signed-in user may
// open /admin. The e-mail allowlist (ADMIN_EMAILS) is server-only, so the
// browser asks this function instead of reading the environment.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminAccess } from "./admin-access.server";

export type { AdminAccess };

const DENIED: AdminAccess = {
  isAdmin: false,
  isChefe: false,
  email: null,
  viaEmail: false,
};

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAccess> => {
    try {
      const { resolveAdminAccess } = await import("./admin-access.server");
      return await resolveAdminAccess(context.supabase, context.userId, context.claims);
    } catch (error) {
      console.error("[TV Lebara] Falha ao verificar o acesso administrativo.", error);
      return DENIED;
    }
  });
