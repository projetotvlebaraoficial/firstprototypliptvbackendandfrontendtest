import { isPeriod, isTier, periodOf, tiers, type BillingPeriod, type PlanTier } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crown, UserRound, UserX, Ban, TrendingUp, Wallet, CalendarClock, UserPlus } from "lucide-react";
import { adminQuery, brl, fmtDate, planLabel } from "@/lib/admin-query";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Painel TV Lebara" }, { name: "description", content: "Visão geral em tempo real." }, { property: "og:title", content: "Dashboard — Painel TV Lebara" }, { property: "og:description", content: "Visão geral em tempo real." }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

export function Stat({ label, value, icon: Icon, hint, accent }: { label: string; value: string | number; icon: typeof Crown; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${accent ? "bg-primary text-primary-foreground" : "bg-card"}`}>
      <div className="flex items-center justify-between"><p className={`text-sm ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p><Icon className="h-5 w-5 opacity-70" /></div>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
      {hint && <p className={`mt-1 text-xs ${accent ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { data, dataUpdatedAt } = useSuspenseQuery(adminQuery);
  const u = data.users;
  const by = (l: string) => u.filter((x) => planLabel(x) === l).length;
  const premium = by("Premium") + by("Premium Plus");
  const now = Date.now();
  const week = now + 7 * 864e5;
  const expiring = u.filter((x) => { const e = x.sub?.current_period_end ? new Date(x.sub.current_period_end).getTime() : 0; return planLabel(x).startsWith("Premium") && e < week; }).length;
  const notRenew = u.filter((x) => x.sub?.cancel_at_period_end).length;
  const new30 = u.filter((x) => new Date(x.created_at).getTime() > now - 30 * 864e5).length;
  const paid = data.payments.filter((p) => ["aprovado", "pago", "approved"].includes(p.status));
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const revMonth = paid.filter((p) => new Date(p.paid_at ?? p.created_at) >= month).reduce((s, p) => s + p.amount_cents, 0);
  const mrr = u.filter((x) => planLabel(x).startsWith("Premium")).reduce((s, x) => { const t = isTier(x.sub?.plan_tier) ? x.sub!.plan_tier as PlanTier : "premium"; const p = isPeriod(x.sub?.billing_period) ? x.sub!.billing_period as BillingPeriod : "mensal"; return s + Math.round(tiers[t].realPriceCents[p] / periodOf(p).months); }, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="font-display text-3xl font-extrabold">Dashboard</h1><p className="text-muted-foreground">Atualiza automaticamente a cada 10 segundos.</p></div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" />Última atualização {new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")}</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat accent label="Usuários Premium ativos" value={premium} icon={Crown} hint={`${u.length ? Math.round((premium / u.length) * 100) : 0}% da base`} />
        <Stat label="Usuários Free" value={by("Free")} icon={UserRound} />
        <Stat label="Não renovaram" value={by("Não renovou")} icon={UserX} hint="Assinatura venceu" />
        <Stat label="Cancelaram renovação" value={notRenew} icon={CalendarClock} hint="Ainda ativos até o vencimento" />
        <Stat label="Vencem em 7 dias" value={expiring} icon={CalendarClock} />
        <Stat label="Novos cadastros (30 dias)" value={new30} icon={UserPlus} />
        <Stat label="Contas banidas" value={u.filter((x) => x.banned).length} icon={Ban} />
        <Stat label="Total de cadastros" value={u.length} icon={UserRound} />
        <Stat label="Receita recorrente estimada" value={brl(mrr)} icon={TrendingUp} hint="Soma mensal dos planos ativos" />
        <Stat label="Recebido no mês" value={brl(revMonth)} icon={Wallet} />
        <Stat label="Recebido no total" value={brl(paid.reduce((s, p) => s + p.amount_cents, 0))} icon={Wallet} />
        <Stat label="Perfis incompletos" value={u.filter((x) => !x.cpf).length} icon={UserRound} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">Últimos cadastros</h2>
          <ul className="mt-3 divide-y text-sm">
            {u.slice(0, 8).map((x) => <li key={x.id} className="flex justify-between gap-3 py-2.5"><span className="truncate">{x.full_name || x.email}</span><span className="shrink-0 text-muted-foreground">{planLabel(x)} · {fmtDate(x.created_at)}</span></li>)}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">Ações recentes da equipe</h2>
          <ul className="mt-3 divide-y text-sm">
            {data.actions.length === 0 && <li className="py-2.5 text-muted-foreground">Nenhuma ação registrada ainda.</li>}
            {data.actions.slice(0, 8).map((a) => {
              const admin = u.find((x) => x.id === a.admin_id); const t = u.find((x) => x.id === a.target_user_id);
              return <li key={a.id} className="py-2.5"><b>{admin?.full_name || admin?.email || "—"}</b> · {a.action} · {t?.full_name || t?.email || ""} <span className="text-muted-foreground">({new Date(a.created_at).toLocaleString("pt-BR")})</span></li>;
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
