import { useEffect, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackIp } from "@/lib/admin.functions";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LayoutDashboard, PlayCircle, Heart, User, CreditCard, MessageCircle, Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery } from "@/lib/account";

const links = [
  { to: "/minha-conta", label: "Painel", icon: LayoutDashboard },
  { to: "/assistir", label: "Assistir", icon: PlayCircle },
  { to: "/minha-lista", label: "Minha lista", icon: Heart },
  { to: "/assinatura", label: "Assinatura", icon: CreditCard },
  { to: "/perfil", label: "Meu perfil", icon: User },
  { to: "/suporte", label: "Suporte", icon: MessageCircle },
] as const;

export function AccountShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { data } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const name = data.profile?.full_name || data.user.email;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const track = useServerFn(trackIp);
  useEffect(() => { track().catch(() => {}); }, [track]);
  const banned = !!data.profile?.banned;
  const mustComplete = !data.profileComplete && pathname !== "/perfil";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <section className="px-3 pb-20 pt-24 md:px-5 md:pt-28">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-3xl border bg-card p-4 shadow-soft lg:sticky lg:top-28">
          <div className="mb-3 rounded-2xl bg-ink p-4 text-ink-foreground">
            <p className="text-xs uppercase tracking-wider text-ink-foreground/60">Olá,</p>
            <p className="truncate font-display font-bold">{name}</p>
            <span className="mt-2 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">{data.subscription?.status === "ativa" ? "Usuário Premium" : "Usuário Free"}</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Área do assinante">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "!bg-primary/10 !text-primary" }}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            ))}
            {data.isAdmin && (
              <Link to="/admin" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted" activeProps={{ className: "!bg-primary/10 !text-primary" }}>
                <Shield className="h-4 w-4" />Painel administrativo
              </Link>
            )}
            <button onClick={signOut} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted">
              <LogOut className="h-4 w-4" />Sair
            </button>
          </nav>
        </aside>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">
            {banned ? (
              <Panel><h2 className="font-display text-xl font-bold text-primary">Conta suspensa</h2><p className="mt-2 text-muted-foreground">Sua conta foi suspensa pela administração.{data.profile?.ban_reason ? ` Motivo: ${data.profile.ban_reason}` : ""} Fale com contato@tvlebara.com.br.</p></Panel>
            ) : mustComplete ? (
              <Panel><h2 className="font-display text-xl font-bold">Complete seu perfil</h2><p className="mt-2 text-muted-foreground">Para continuar usando a TV Lebara, preencha seus dados (CPF, data de nascimento, WhatsApp e endereço). É obrigatório e leva só um minuto.</p><Link to="/perfil" className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Completar perfil</Link></Panel>
            ) : children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border bg-card p-6 shadow-soft md:p-8 ${className}`}>{children}</div>;
}
