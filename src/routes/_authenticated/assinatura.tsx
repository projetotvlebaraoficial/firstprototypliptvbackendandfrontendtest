import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { setAutoRenewal } from "@/lib/payments.functions";
import { AccountShell, Panel } from "@/components/site/AccountShell";
import { Button } from "@/components/ui/button";
import { accountQuery, paymentsQuery, tvCount, userLabel } from "@/lib/account";
import { formatBRL, periodOf } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/assinatura")({
  head: () => ({ meta: [{ title: "Minha assinatura — TV Lebara" }, { name: "description", content: "Gerencie sua assinatura e veja pagamentos." }, { property: "og:title", content: "Minha assinatura — TV Lebara" }, { property: "og:description", content: "Gerencie sua assinatura." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(accountQuery), context.queryClient.ensureQueryData(paymentsQuery)]),
  component: Subscription,
});

function Subscription() {
  const { data } = useSuspenseQuery(accountQuery);
  const { data: payments } = useSuspenseQuery(paymentsQuery);
  const qc = useQueryClient();
  const renewFn = useServerFn(setAutoRenewal);
  const sub = data.subscription;
  const active = sub?.status === "ativa";

  async function toggleRenewal(cancel: boolean) {
    try { await renewFn({ data: { cancel } }); } catch { return void toast.error("Não foi possível atualizar."); }
    toast.success(cancel ? "Renovação cancelada. Seu acesso continua até o fim do período pago." : "Renovação reativada!");
    qc.invalidateQueries({ queryKey: ["account"] });
  }

  return (
    <AccountShell title="Minha assinatura" subtitle="Plano, renovação e histórico de pagamentos.">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plano</p>
            <p className="font-display text-2xl font-bold">{sub?.plan_name}</p>
            <p className="mt-1 text-primary font-display text-xl font-extrabold">{formatBRL(sub?.price_cents ?? 3000)} · {periodOf(sub?.billing_period ?? "mensal").label}</p>
            {active && <p className="mt-2 text-sm">IPTV disponível para: <span className="rounded-lg bg-primary px-2.5 py-0.5 font-extrabold text-primary-foreground">{tvCount(sub)}</span></p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{userLabel(sub)}</span>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${active ? "bg-primary-foreground animate-pulse" : "bg-muted-foreground"}`} />
              {active ? `IPTV Ativo · ${tvCount(sub)}` : "IPTV Indisponível"}
            </span>
          </div>
        </div>
        {active ? (
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              {sub?.cancel_at_period_end ? "Acesso até" : "Próxima cobrança em"}{" "}
              <strong className="text-foreground">{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"}</strong>
            </p>
            {sub?.cancel_at_period_end
              ? <Button className="mt-4 rounded-full" onClick={() => toggleRenewal(false)}>Reativar renovação</Button>
              : <Button variant="outline" className="mt-4 rounded-full" onClick={() => toggleRenewal(true)}>Cancelar renovação automática</Button>}
          </div>
        ) : (
          <Button asChild size="lg" className="mt-6 rounded-full"><Link to="/checkout">Assinar agora</Link></Button>
        )}
      </Panel>
      <Panel className="mt-6">
        <h2 className="font-display text-xl font-bold">Histórico de pagamentos</h2>
        {payments.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className="mt-4 divide-y">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span>{new Date(p.paid_at ?? p.created_at).toLocaleDateString("pt-BR")}</span>
                <span className="text-muted-foreground">{p.method ?? "—"}</span>
                <span className="font-semibold">{formatBRL(p.amount_cents)}</span>
                <span className="text-muted-foreground">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AccountShell>
  );
}
