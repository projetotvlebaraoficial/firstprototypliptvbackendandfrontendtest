import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Clapperboard,
  Wallet,
  ShieldCheck,
  ArrowLeft,
  Newspaper,
  Link2,
} from "lucide-react";
import { accountQuery } from "@/lib/account";
import logo from "@/assets/tv-lebara-logo.png";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — TV Lebara" },
      { name: "description", content: "Gestão de usuários, assinaturas e finanças." },
      { property: "og:title", content: "Painel administrativo — TV Lebara" },
      { property: "og:description", content: "Gestão de usuários, assinaturas e finanças." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    if (!acc.isAdmin) throw redirect({ to: "/minha-conta" });
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/conteudos", label: "Conteúdos", icon: Clapperboard },
  { to: "/admin/noticias", label: "Notícias", icon: Newspaper },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/admin/planos", label: "Planos TV Lebara", icon: Link2 },
  { to: "/admin/cargos", label: "Cargos", icon: ShieldCheck },
] as const;

function AdminLayout() {
  const { data: account } = useSuspenseQuery(accountQuery);
  const name = account.profile?.full_name || account.user.email;
  const role = account.isChefe
    ? "Administrador-chefe"
    : account.isAdmin
      ? "Administrador"
      : "Utilizador";
  return (
    <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b bg-card p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <img src={logo} alt="TV Lebara" className="h-10 w-auto" />
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-primary">
          Painel administrativo
        </p>
        <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(({ to, label, icon: Icon, ...r }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: "exact" in r }}
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              activeProps={{ className: "!bg-primary !text-primary-foreground" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <Link
            to="/minha-conta"
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted lg:mt-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
        </nav>
        <div className="mt-6 hidden rounded-2xl bg-ink p-4 text-ink-foreground lg:block">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="text-xs text-ink-foreground/70">{role}</p>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
