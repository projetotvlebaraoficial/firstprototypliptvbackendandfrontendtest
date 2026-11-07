import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth";
import logo from "@/assets/tv-lebara-logo.png";

const nav = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/programacao", label: "Programação" },
  { to: "/conteudos", label: "Conteúdos" },
  { to: "/noticias", label: "Notícias e Novidades" },
  { to: "/planos", label: "Assinatura" },
] as const;

export function Logo({ className }: { className?: string | undefined }) {
  return (
    <Link to="/" aria-label="TV Lebara, início" className="shrink-0">
      <img src={logo} alt="TV Lebara" width={1441} height={367} className={cn("h-9 w-auto md:h-10", className)} />
    </Link>
  );
}

export function SiteHeader({ overlay: _overlay }: { overlay?: boolean | undefined }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuthUser();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4">
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/85 px-4 py-2.5 backdrop-blur-xl transition-all duration-500 md:px-6",
          scrolled ? "shadow-lift" : "shadow-soft",
        )}
      >
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full bg-muted/70 p-1 lg:flex" aria-label="Principal">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-4 py-2 text-[0.92rem] font-medium text-muted-foreground transition-all hover:text-foreground"
              activeProps={{ className: "!bg-card !text-foreground shadow-soft" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button asChild className="rounded-full"><Link to="/minha-conta">Minha conta <ArrowRight /></Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/auth" search={{ modo: "entrar" }}>Entrar</Link></Button>
              <Button asChild className="rounded-full"><Link to="/auth" search={{ modo: "cadastro" }}>Criar conta <ArrowRight /></Link></Button>
            </>
          )}
        </div>
        <button
          className="rounded-xl bg-muted p-2.5 text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav id="menu-mobile" className="mx-auto mt-2 max-w-7xl animate-rise space-y-1 rounded-2xl border bg-card p-3 shadow-lift lg:hidden" aria-label="Menu móvel">
          {[...nav, { to: "/faq", label: "Perguntas frequentes" }, { to: "/contato", label: "Contato" }].map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-lg font-medium hover:bg-muted">
              {n.label}
            </Link>
          ))}
          <Button asChild size="lg" className="mt-2 w-full rounded-full">
            {user ? <Link to="/minha-conta" onClick={() => setOpen(false)}>Minha conta</Link> : <Link to="/auth" search={{ modo: "entrar" }} onClick={() => setOpen(false)}>Entrar ou criar conta</Link>}
          </Button>
        </nav>
      )}
    </header>
  );
}
