import { Link } from "@tanstack/react-router";
import { ArrowRight, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { company, formatBRL, plan } from "@/lib/site";
import { Logo } from "./SiteHeader";
import { openCookiePreferences } from "./CookieConsent";

export function SiteFooter() {
  const cols = [
    { title: "Navegação", links: [["/", "Início"], ["/sobre", "Sobre"], ["/programacao", "Programação"], ["/conteudos", "Conteúdos"], ["/planos", "Assinatura"]] },
    { title: "Ajuda", links: [["/faq", "Perguntas frequentes"], ["/contato", "Contato"], ["/classificacao-indicativa", "Classificação indicativa"]] },
    { title: "Legal", links: [["/termos", "Termos de uso"], ["/privacidade", "Política de privacidade"], ["/cookies", "Política de cookies"]] },
  ] as const;
  return (
    <footer className="px-3 pb-3 md:px-5 md:pb-5">
      {/* Chamada final */}
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-primary px-6 py-14 text-primary-foreground md:px-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-glow/50 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="max-w-xl text-3xl font-extrabold md:text-5xl">Faça parte da TV Lebara.</h2>
            <p className="mt-3 text-lg text-primary-foreground/85">Programação ao vivo e conteúdos gravados a partir de {formatBRL(plan.priceCents)}/mês.</p>
          </div>
          <Button asChild size="lg" variant="ink" className="rounded-full">
            <Link to="/planos">Quero assinar <ArrowRight /></Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-3 max-w-7xl rounded-[2rem] border bg-card px-6 py-12 md:px-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Logo className="h-12 md:h-12" />
            <p className="max-w-xs text-muted-foreground">Conteúdo, memória e diálogo sobre as tradições de matriz africana.</p>
            <div className="flex flex-col items-start gap-2">
              <a href={`mailto:${company.email}`} className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                <Mail className="h-4 w-4 text-primary" /> {company.email}
              </a>
              <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                <Instagram className="h-4 w-4 text-primary" /> {company.instagramHandle}
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">{c.title}</h3>
              <ul className="space-y-3">
                {c.links.map(([to, label]) => (
                  <li key={to}><Link to={to} className="text-muted-foreground transition-colors hover:text-foreground">{label}</Link></li>
                ))}
                {c.title === "Legal" && (
                  <li><button onClick={openCookiePreferences} className="text-muted-foreground transition-colors hover:text-foreground">Preferências de cookies</button></li>
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} {company.name}. Todos os direitos reservados.</span>
          <span>{company.legalName} · CNPJ {company.cnpj}</span>
        </div>
      </div>
    </footer>
  );
}
