import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, ShieldCheck } from "lucide-react";
import { PageIntro } from "@/components/site/PageShell";
import { PlanCard } from "@/components/site/PlanCard";
import { isTier, type PlanTier } from "@/lib/site";

type Search = { plano?: PlanTier | undefined };

export const Route = createFileRoute("/assinar")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    plano: isTier(search["plano"]) ? search["plano"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Assinar a TV Lebara — planos oficiais" },
      {
        name: "description",
        content:
          "Escolha entre Premium (1 TV) e Premium Plus (até 3 TVs). No checkout você seleciona o período e a forma de pagamento. Credenciais liberadas após a confirmação.",
      },
      { property: "og:title", content: "Assinar a TV Lebara" },
      {
        property: "og:description",
        content:
          "Planos oficiais TV Lebara. Pagamento pelo site e credenciais liberadas automaticamente após a confirmação.",
      },
    ],
  }),
  component: AssinarPage,
});

function AssinarPage() {
  const { plano } = Route.useSearch();

  return (
    <>
      <PageIntro eyebrow="Assinatura oficial" title="Escolha seu plano oficial da TV Lebara">
        Premium para 1 TV ou Premium Plus para até 3 TVs. Clique em <strong>Assinar</strong> e, no
        checkout, escolha o período (mensal, trimestral, semestral ou anual) e a forma de pagamento
        (Pix ou cartão).
      </PageIntro>

      <section className="py-16">
        <div className="container-page">
          <PlanCard highlightTier={plano} />

          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border bg-card p-6 text-sm text-muted-foreground md:p-8">
            <p className="flex items-start gap-3 font-semibold text-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              Como funciona a liberação do acesso
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Escolha o plano e clique em Assinar.</li>
              <li>No checkout, selecione o período e pague com Pix ou cartão.</li>
              <li>O gateway confirma o pagamento e envia o webhook para o site.</li>
              <li>
                O site cria sua conta oficial TV Lebara com o <strong>ID exato</strong> do plano
                contratado.
              </li>
              <li>
                Usuário e senha aparecem em{" "}
                <Link to="/minha-conta" className="font-semibold text-primary hover:underline">
                  Minha conta
                </Link>{" "}
                assim que a criação terminar.
              </li>
            </ol>
            <p className="mt-4 flex items-start gap-2">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" />A assinatura é renovada
              automaticamente conforme o período escolhido e pode ser cancelada na área do
              assinante.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ainda quer conhecer antes?{" "}
            <Link to="/teste-gratis" className="font-semibold text-primary hover:underline">
              Crie sua conta e gere um teste grátis de 4 horas
            </Link>
            . O teste é liberado no painel do assinante, 1 vez por perfil e por CPF.
          </p>
        </div>
      </section>
    </>
  );
}
