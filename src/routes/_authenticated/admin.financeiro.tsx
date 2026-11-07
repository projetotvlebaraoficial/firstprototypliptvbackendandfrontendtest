import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { adminQuery, brl } from "@/lib/admin-query";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Painel TV Lebara" }, { name: "description", content: "Pagamentos e receita." }, { property: "og:title", content: "Financeiro — Painel TV Lebara" }, { property: "og:description", content: "Pagamentos e receita." }, { name: "robots", content: "noindex" }] }),
  component: Finance,
});

function Finance() {
  const { data } = useSuspenseQuery(adminQuery);
  const months = new Map<string, number>();
  data.payments.filter((p) => ["aprovado", "pago", "approved"].includes(p.status)).forEach((p) => {
    const k = new Date(p.paid_at ?? p.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    months.set(k, (months.get(k) ?? 0) + p.amount_cents);
  });
  const max = Math.max(1, ...months.values());
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Financeiro</h1>
      <p className="text-muted-foreground">Os pagamentos chegarão automaticamente quando o Mercado Pago for ligado.</p>
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Receita por mês</h2>
        {months.size === 0 ? <p className="mt-3 text-sm text-muted-foreground">Sem pagamentos ainda.</p> : (
          <div className="mt-4 space-y-2">
            {[...months].map(([m, v]) => <div key={m} className="grid grid-cols-[90px_1fr_100px] items-center gap-3 text-sm"><span>{m}</span><div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div><span className="text-right font-semibold">{brl(v)}</span></div>)}
          </div>
        )}
      </section>
      <section className="mt-6 overflow-x-auto rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Pagamentos</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-muted-foreground"><tr><th className="py-2">Data</th><th>Usuário</th><th>Valor</th><th>Forma</th><th>Status</th></tr></thead>
          <tbody className="divide-y">
            {data.payments.map((p) => { const u = data.users.find((x) => x.id === p.user_id); return (
              <tr key={p.id}><td className="py-2.5">{new Date(p.paid_at ?? p.created_at).toLocaleString("pt-BR")}</td><td>{u?.full_name || u?.email || "—"}</td><td>{brl(p.amount_cents)}</td><td className="uppercase">{p.method ?? "—"}</td><td>{p.status}</td></tr>
            ); })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
