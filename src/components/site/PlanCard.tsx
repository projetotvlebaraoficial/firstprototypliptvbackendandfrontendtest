import { Link } from "@tanstack/react-router";
import { Check, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, plan, tiers, type PlanTier } from "@/lib/site";

function OneCard({ tier, highlight }: { tier: PlanTier; highlight?: boolean }) {
  const t = tiers[tier];
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[2rem] border bg-card p-8 shadow-lift md:p-10 ${highlight ? "ring-2 ring-primary" : ""}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-primary" />
      {highlight && tier === "premium_plus" && (
        <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          Para a família
        </span>
      )}
      <p className="font-display text-2xl font-extrabold">Plano {t.name}</p>
      <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 font-display text-lg font-extrabold text-primary">
        <Tv className="h-5 w-5" />
        {tier === "premium_plus" ? "Até 3 TVs" : "1 TV"} + Conteúdos no site
      </p>
      <p className="mt-5 text-sm text-muted-foreground">A partir de</p>
      <p className="font-display text-5xl font-extrabold text-primary">
        {formatBRL(t.realPriceCents.mensal)}
        <span className="text-xl font-semibold text-muted-foreground">/mês</span>
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Escolha o período e a forma de pagamento no checkout.
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        <li className="flex gap-3">
          <Check className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
          IPTV para assistir em <strong>{t.tvLabel}</strong>
        </li>
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3">
            <Check className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Button asChild size="lg" className="mt-8 w-full rounded-full">
        <Link to="/checkout" search={{ plano: tier }}>
          Assinar {t.name}
        </Link>
      </Button>
      <Link
        to="/teste-gratis"
        className="mt-3 text-center text-sm font-semibold text-primary hover:underline"
      >
        Ou crie sua conta e teste grátis por 4 horas
      </Link>
    </div>
  );
}

export function PlanCard({ highlightTier }: { highlightTier?: PlanTier | undefined }) {
  const highlighted = highlightTier ?? "premium_plus";
  return (
    <div className="w-full">
      <div className="grid gap-6 md:grid-cols-2">
        <OneCard tier="premium" highlight={highlighted === "premium"} />
        <OneCard tier="premium_plus" highlight={highlighted === "premium_plus"} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Renovação automática. Cancele quando quiser, conforme as condições da assinatura.
      </p>
    </div>
  );
}
