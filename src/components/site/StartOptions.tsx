import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HORIZON_TRIAL_HOURS } from "@/lib/horizon";

const trialPoints = [
  "Cadastro gratuito no site",
  `Teste de ${HORIZON_TRIAL_HOURS} horas liberado no painel do assinante`,
  "1 teste por CPF e por perfil",
];

const officialPoints = [
  "Planos oficiais TV Lebara",
  "Premium (1 TV) ou Premium Plus (até 3 TVs)",
  "Credenciais liberadas após a confirmação do pagamento",
];

export function StartOptions() {
  return (
    <section className="py-16">
      <div className="container-page">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow mb-3">Comece agora</p>
          <h2 className="text-3xl font-extrabold md:text-5xl">Escolha como quer começar</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Crie sua conta gratuita e teste por {HORIZON_TRIAL_HOURS} horas no painel do assinante,
            ou assine um plano oficial com credenciais liberadas após o pagamento.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative flex flex-col overflow-hidden rounded-[2rem] border bg-card p-8 shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-primary" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </span>
            <p className="mt-5 font-display text-2xl font-extrabold">
              Teste grátis de {HORIZON_TRIAL_HOURS} horas
            </p>
            <p className="mt-2 text-muted-foreground">
              Conheça a plataforma sem compromisso. Crie sua conta e gere o teste no painel do
              assinante.
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {trialPoints.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="outline" className="mt-7 w-full rounded-full">
              <Link to="/teste-gratis">Criar conta e testar grátis</Link>
            </Button>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-[2rem] border bg-ink p-8 text-ink-foreground shadow-lift ring-2 ring-primary">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-primary" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <p className="mt-5 font-display text-2xl font-extrabold">Assinatura oficial</p>
            <p className="mt-2 text-ink-foreground/70">
              Escolha seu plano e pague com segurança. As credenciais oficiais são liberadas
              automaticamente após a confirmação do pagamento.
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-foreground/85">
              {officialPoints.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow" />
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-7 w-full rounded-full">
              <Link to="/assinar">
                Assinar agora <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
