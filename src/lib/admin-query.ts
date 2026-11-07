import { queryOptions } from "@tanstack/react-query";
import { adminOverview } from "@/lib/admin.functions";

export const adminQuery = queryOptions({
  queryKey: ["admin-overview"],
  queryFn: () => adminOverview(),
  refetchInterval: 10_000,
});

export type AdminData = Awaited<ReturnType<typeof adminOverview>>;
export type AdminUser = AdminData["users"][number];

export const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");
export const isLifetime = (d?: string | null) => !!d && new Date(d).getFullYear() >= 2099;

export function roleLabel(roles: string[]) {
  if (roles.includes("admin_chefe")) return "Administrador-chefe";
  if (roles.includes("admin")) return "Administrador";
  return "Usuário";
}

export function planLabel(u: AdminUser) {
  const now = Date.now();
  const end = u.sub?.current_period_end ? new Date(u.sub.current_period_end).getTime() : 0;
  if (u.sub?.status === "ativa" && end > now) return (u.sub as { plan_tier?: string }).plan_tier === "premium_plus" ? "Premium Plus" : "Premium";
  if (u.sub?.status === "ativa" || u.sub?.status === "expirada") return "Não renovou";
  if (u.sub?.status === "cancelada") return "Cancelada";
  return "Free";
}
