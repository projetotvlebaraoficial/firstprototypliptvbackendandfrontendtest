import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAction } from "@/lib/admin.functions";
import { adminQuery, roleLabel } from "@/lib/admin-query";

export const Route = createFileRoute("/_authenticated/admin/cargos")({
  head: () => ({ meta: [{ title: "Cargos — Painel TV Lebara" }, { name: "description", content: "Equipe administrativa." }, { property: "og:title", content: "Cargos — Painel TV Lebara" }, { property: "og:description", content: "Equipe administrativa." }, { name: "robots", content: "noindex" }] }),
  component: Roles,
});

function Roles() {
  const { data } = useSuspenseQuery(adminQuery);
  const qc = useQueryClient();
  const act = useServerFn(adminAction);
  const [q, setQ] = useState("");
  const team = data.users.filter((u) => u.roles.some((r) => r === "admin" || r === "admin_chefe"));
  const found = q.length > 2 ? data.users.filter((u) => !team.includes(u) && (u.email + (u.full_name ?? "")).toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];

  async function set(userId: string, value: boolean) {
    try { await act({ data: { userId, action: "set_admin", value } }); toast.success(value ? "Agora é Administrador (com assinatura vitalícia)" : "Cargo removido"); qc.invalidateQueries({ queryKey: ["admin-overview"] }); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Cargos</h1>
      <p className="text-muted-foreground">Somente o Administrador-chefe pode nomear ou remover Administradores. Toda a equipe recebe assinatura vitalícia.</p>
      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Equipe</h2>
        <ul className="mt-3 divide-y text-sm">
          {team.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="font-semibold">{u.full_name || u.email}</p><p className="text-muted-foreground">{u.email}</p></div>
              <div className="flex items-center gap-3"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{roleLabel(u.roles)}</span>
                {data.me.chefe && !u.roles.includes("admin_chefe") && <Button size="sm" variant="outline" className="rounded-full" onClick={() => set(u.id, false)}>Remover cargo</Button>}</div>
            </li>
          ))}
        </ul>
      </section>
      {data.me.chefe && (
        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold">Nomear Administrador</h2>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busque por nome ou e-mail" className="mt-3 h-11 max-w-md" />
          <ul className="mt-3 divide-y text-sm">
            {found.map((u) => <li key={u.id} className="flex items-center justify-between gap-3 py-2.5"><span>{u.full_name || u.email} <span className="text-muted-foreground">({u.email})</span></span><Button size="sm" className="rounded-full" onClick={() => set(u.id, true)}>Tornar Administrador</Button></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
