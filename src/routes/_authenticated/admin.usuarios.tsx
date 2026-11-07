import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminAction } from "@/lib/admin.functions";
import { adminQuery, fmtDate, isLifetime, planLabel, roleLabel, type AdminUser } from "@/lib/admin-query";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Painel TV Lebara" }, { name: "description", content: "Gestão de usuários." }, { property: "og:title", content: "Usuários — Painel TV Lebara" }, { property: "og:description", content: "Gestão de usuários." }, { name: "robots", content: "noindex" }] }),
  component: Users,
});

const filters = ["Todos", "Premium", "Premium Plus", "Free", "Não renovou", "Cancelada", "Banidos"];

function Users() {
  const { data } = useSuspenseQuery(adminQuery);
  const [q, setQ] = useState("");
  const [f, setF] = useState("Todos");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = data.users.filter((u) => (f === "Todos" || (f === "Banidos" ? u.banned : planLabel(u) === f)) && `${u.full_name} ${u.email} ${u.cpf} ${u.signup_ip}`.toLowerCase().includes(q.toLowerCase()));
  const open = data.users.find((u) => u.id === openId);
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Usuários</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nome, e-mail, CPF ou IP" className="h-10 max-w-xs" />
        {filters.map((x) => <button key={x} onClick={() => setF(x)} className={`rounded-full px-4 py-2 text-sm font-medium ${f === x ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"}`}>{x}</button>)}
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3">Usuário</th><th>Plano</th><th>Válido até</th><th>Cargo</th><th>IP de cadastro</th><th>Cadastro</th><th /></tr></thead>
          <tbody className="divide-y">
            {list.map((u) => (
              <tr key={u.id} className={u.banned ? "opacity-60" : ""}>
                <td className="p-3"><p className="font-semibold">{u.full_name || "—"}{u.banned && <span className="ml-2 rounded bg-destructive px-1.5 text-[10px] text-destructive-foreground">BANIDO</span>}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${planLabel(u).startsWith("Premium") ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{planLabel(u)}</span></td>
                <td>{isLifetime(u.sub?.current_period_end) ? "Vitalício" : fmtDate(u.sub?.current_period_end)}</td>
                <td>{roleLabel(u.roles)}</td>
                <td className="font-mono text-xs">{u.signup_ip ?? "—"}</td>
                <td>{fmtDate(u.created_at)}</td>
                <td className="pr-3 text-right"><Button size="sm" variant="outline" className="rounded-full" onClick={() => setOpenId(u.id)}>Gerenciar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">{open && <Manage u={open} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function Manage({ u }: { u: AdminUser }) {
  const qc = useQueryClient();
  const act = useServerFn(adminAction);
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState("");
  async function run(d: Parameters<typeof act>[0]["data"], ok: string) {
    try { await act({ data: d }); toast.success(ok); qc.invalidateQueries({ queryKey: ["admin-overview"] }); }
    catch (e) { toast.error((e as Error).message); }
  }
  const row = (k: string, v?: string | null) => <div className="flex justify-between gap-3 py-1.5"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v || "—"}</span></div>;
  return (
    <>
      <DialogHeader><DialogTitle>{u.full_name || u.email}</DialogTitle></DialogHeader>
      <div className="divide-y text-sm">
        {row("E-mail", u.email)}{row("CPF", u.cpf)}{row("Nascimento", fmtDate(u.birth_date))}{row("WhatsApp", u.whatsapp)}
        {row("Endereço", [u.address, u.city, u.state, u.cep].filter(Boolean).join(", "))}
        {row("IP de cadastro", u.signup_ip)}{row("Último IP", u.last_ip)}{row("Último acesso", u.last_sign_in ? new Date(u.last_sign_in).toLocaleString("pt-BR") : null)}
        {row("Plano", planLabel(u))}{row("Válido até", isLifetime(u.sub?.current_period_end) ? "Vitalício" : fmtDate(u.sub?.current_period_end))}{row("Cargo", roleLabel(u.roles))}
      </div>
      <div className="space-y-4 border-t pt-4">
        <div><p className="mb-2 text-sm font-semibold">Plano</p><div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full" onClick={() => run({ userId: u.id, action: "set_status", status: "ativa" }, "Agora é Premium")}>Tornar Premium</Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => run({ userId: u.id, action: "set_tier", tier: "premium" }, "Tipo: Premium (1 TV)")}>Tipo Premium (1 TV)</Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => run({ userId: u.id, action: "set_tier", tier: "premium_plus" }, "Tipo: Premium Plus (3 TVs)")}>Tipo Premium Plus (3 TVs)</Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => run({ userId: u.id, action: "set_status", status: "pendente" }, "Agora é Free")}>Tornar Free</Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => run({ userId: u.id, action: "set_status", status: "cancelada" }, "Assinatura cancelada")}>Cancelar assinatura</Button>
        </div></div>
        <div><p className="mb-2 text-sm font-semibold">Dias de assinatura</p><div className="flex gap-2">
          <Input type="number" value={days} onChange={(e) => setDays(Math.abs(parseInt(e.target.value) || 0))} className="h-9 w-24" />
          <Button size="sm" className="rounded-full" onClick={() => run({ userId: u.id, action: "add_days", days }, `+${days} dias`)}>+ Adicionar</Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => run({ userId: u.id, action: "add_days", days: -days }, `-${days} dias`)}>− Retirar</Button>
        </div></div>
        <div><p className="mb-2 text-sm font-semibold">Banimento</p>
          {u.banned ? <><p className="mb-2 text-sm text-muted-foreground">Motivo: {u.ban_reason || "—"}</p><Button size="sm" variant="outline" className="rounded-full" onClick={() => run({ userId: u.id, action: "unban" }, "Conta reativada")}>Desbanir</Button></>
            : <div className="flex gap-2"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo" className="h-9" /><Button size="sm" variant="destructive" className="rounded-full" onClick={() => run({ userId: u.id, action: "ban", reason }, "Conta banida")}>Banir</Button></div>}
        </div>
      </div>
    </>
  );
}
