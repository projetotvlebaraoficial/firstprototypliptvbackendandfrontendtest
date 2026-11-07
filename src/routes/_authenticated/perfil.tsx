import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Autocomplete } from "@/components/site/Autocomplete";
import { citiesOf, lookupCep, maskCep, maskCpf, maskPhone, stateLabel, states } from "@/lib/br";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AccountShell, Panel } from "@/components/site/AccountShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountQuery, isValidCpf } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — TV Lebara" }, { name: "description", content: "Dados pessoais e senha." }, { property: "og:title", content: "Meu perfil — TV Lebara" }, { property: "og:description", content: "Dados pessoais e senha." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: Profile,
});

function Profile() {
  const { data } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const pr = data.profile;
  const [saving, setSaving] = useState(false);
  const [cpf, setCpf] = useState(maskCpf(pr?.cpf ?? ""));
  const [phone, setPhone] = useState(maskPhone(pr?.whatsapp ?? ""));
  const [cep, setCep] = useState(maskCep(pr?.cep ?? ""));
  const [cepState, setCepState] = useState<"idle" | "loading" | "ok" | "error">(pr?.cep ? "ok" : "idle");
  const [street, setStreet] = useState(pr?.address ?? "");
  const [hood, setHood] = useState(pr?.neighborhood ?? "");
  const [uf, setUf] = useState(pr?.state ?? "");
  const [city, setCity] = useState(pr?.city ?? "");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (!uf) return setCities([]);
    citiesOf(uf).then(setCities).catch(() => toast.error("Não foi possível carregar as cidades."));
  }, [uf]);

  async function onCep(v: string) {
    const m = maskCep(v);
    setCep(m);
    if (m.replace(/\D/g, "").length !== 8) return setCepState("idle");
    setCepState("loading");
    try {
      const r = await lookupCep(m);
      if (!r) { setCepState("error"); return; }
      setStreet(r.street); setHood(r.neighborhood); setUf(r.uf); setCity(r.city); setCepState("ok");
    } catch { setCepState("error"); }
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string, n = 160) => String(f.get(k) ?? "").trim().slice(0, n);
    const digits = cpf.replace(/\D/g, "");
    if (!isValidCpf(digits)) return void toast.error("CPF inválido.");
    const whatsapp = phone.replace(/\D/g, "");
    if (whatsapp.length < 10) return void toast.error("WhatsApp inválido.");
    if (cepState !== "ok") return void toast.error("Informe um CEP válido.");
    if (!uf || !city || !cities.includes(city)) return void toast.error("Selecione o estado e a cidade da lista.");
    if (!street.trim() || !g("number", 20)) return void toast.error("Preencha o endereço e o número.");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: g("name", 120),
      whatsapp,
      cpf: maskCpf(digits),
      birth_date: g("birth_date", 10),
      cep: cep.replace(/\D/g, ""),
      address: street.trim().slice(0, 160),
      address_number: g("number", 20),
      address_complement: g("complement", 80) || null,
      neighborhood: hood.trim().slice(0, 80) || null,
      city: city.slice(0, 80),
      state: uf,
      updated_at: new Date().toISOString(),
    }).eq("id", data.user.id);
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Dados atualizados!");
    qc.invalidateQueries({ queryKey: ["account"] });
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const password = String(f.get("new"));
    if (password.length < 8) return void toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
    const { error } = await supabase.auth.updateUser({ password, current_password: String(f.get("current")) } as { password: string });
    if (error) return void toast.error("Senha atual incorreta ou senha inválida.");
    form.reset();
    toast.success("Senha alterada!");
  }

  return (
    <AccountShell title="Meu perfil" subtitle="Seus dados ficam visíveis apenas para você.">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="font-display text-xl font-bold">Dados pessoais</h2>
          {!data.profileComplete && <p className="mt-2 rounded-xl bg-primary/10 p-3 text-sm font-medium text-primary">Preenchimento obrigatório para usar a sua conta.</p>}
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <div><Label htmlFor="name">Nome completo</Label><Input id="name" name="name" defaultValue={pr?.full_name ?? ""} required maxLength={120} className="mt-1.5 h-11" /></div>
            <div><Label>E-mail</Label><Input value={data.user.email ?? ""} disabled className="mt-1.5 h-11" /></div>
            <div><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" inputMode="numeric" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 90000-0000" required className="mt-1.5 h-11" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="cpf">CPF</Label><Input id="cpf" inputMode="numeric" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" required className="mt-1.5 h-11" /></div>
              <div><Label htmlFor="birth_date">Data de nascimento</Label><Input id="birth_date" name="birth_date" type="date" defaultValue={pr?.birth_date ?? ""} required className="mt-1.5 h-11" /></div>
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <div className="relative"><Input id="cep" inputMode="numeric" value={cep} onChange={(e) => void onCep(e.target.value)} placeholder="00000-000" required className="mt-1.5 h-11" />{cepState === "loading" && <Loader2 className="absolute right-3 top-4 h-4 w-4 animate-spin text-primary" />}</div>
              {cepState === "error" && <p className="mt-1 text-xs font-medium text-destructive">CEP não encontrado. Confira os números.</p>}
              {cepState === "idle" && <p className="mt-1 text-xs text-muted-foreground">Digite o CEP para liberar o endereço.</p>}
            </div>
            <fieldset disabled={cepState !== "ok"} className="space-y-4 disabled:opacity-50">
              <div><Label htmlFor="address">Endereço (rua / avenida)</Label><Input id="address" value={street} onChange={(e) => setStreet(e.target.value)} required className="mt-1.5 h-11" /></div>
              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                <div><Label htmlFor="number">Número</Label><Input id="number" name="number" defaultValue={pr?.address_number ?? ""} required maxLength={20} className="mt-1.5 h-11" /></div>
                <div><Label htmlFor="complement">Complemento (opcional)</Label><Input id="complement" name="complement" defaultValue={pr?.address_complement ?? ""} maxLength={80} placeholder="Apto, bloco…" className="mt-1.5 h-11" /></div>
              </div>
              <div><Label htmlFor="hood">Bairro</Label><Input id="hood" value={hood} onChange={(e) => setHood(e.target.value)} className="mt-1.5 h-11" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="state">Estado</Label><Autocomplete id="state" value={uf} onChange={(v) => { setUf(v); setCity(""); }} placeholder="Digite o estado" options={states.map(([u]) => ({ value: u, label: stateLabel(u) }))} /></div>
                <div><Label htmlFor="city">Cidade</Label><Autocomplete id="city" value={city} onChange={setCity} disabled={!uf || cepState !== "ok"} placeholder={uf ? "Digite a cidade" : "Escolha o estado primeiro"} options={cities.map((c) => ({ value: c, label: c }))} /></div>
              </div>
            </fieldset>
            <Button type="submit" disabled={saving} className="rounded-full">{saving ? "Salvando…" : "Salvar"}</Button>
          </form>
        </Panel>
        <Panel>
          <h2 className="font-display text-xl font-bold">Alterar senha</h2>
          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <div><Label htmlFor="current">Senha atual</Label><Input id="current" name="current" type="password" autoComplete="current-password" className="mt-1.5 h-11" /></div>
            <div><Label htmlFor="new">Nova senha</Label><Input id="new" name="new" type="password" required autoComplete="new-password" className="mt-1.5 h-11" /></div>
            <Button type="submit" variant="outline" className="rounded-full">Alterar senha</Button>
          </form>
        </Panel>
      </div>
    </AccountShell>
  );
}
