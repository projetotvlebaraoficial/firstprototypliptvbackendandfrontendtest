import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageShell";
import { PlanCard } from "@/components/site/PlanCard";
import { StartOptions } from "@/components/site/StartOptions";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Assinatura — TV Lebara | a partir de R$ 30,00/mês" },
      {
        name: "description",
        content:
          "Plano mensal da TV Lebara com renovação automática. Veja as condições de cobrança, renovação e cancelamento.",
      },
      { property: "og:title", content: "Assine a TV Lebara" },
      {
        property: "og:description",
        content: "Plano mensal com acesso à programação ao vivo e aos conteúdos gravados.",
      },
    ],
  }),
  component: Planos,
});

const conditions = [
  [
    "Cobrança",
    "O valor é cobrado no momento da contratação e, depois, a cada mês, na mesma data. O preço oficial é confirmado na tela de pagamento.",
  ],
  ["Renovação", "A assinatura é renovada automaticamente todo mês, até que você cancele."],
  [
    "Cancelamento",
    "Você pode cancelar a renovação a qualquer momento pela sua área de assinante. Nenhuma nova cobrança será feita depois disso.",
  ],
  [
    "Acesso após cancelar",
    "Seu acesso continua até o fim do período que já foi pago. Depois, a área de assinante fica indisponível até uma nova contratação.",
  ],
  [
    "Direito de arrependimento",
    "Você pode desistir em até 7 dias após a contratação, como prevê o Código de Defesa do Consumidor.",
  ],
];

function Planos() {
  return (
    <>
      <PageIntro eyebrow="Assinatura" title="A TV Lebara com você, todos os meses">
        Premium para 1 TV ou Premium Plus para até 3 TVs, sem letras miúdas. Quer conhecer antes?{" "}
        <Link to="/teste-gratis" className="font-semibold text-primary-glow hover:underline">
          Crie sua conta e teste grátis por 4 horas
        </Link>
        .
      </PageIntro>
      <StartOptions />
      <section className="py-16">
        <div className="container-page">
          <PlanCard />
          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-2xl font-extrabold">Condições da assinatura</h2>
            <dl className="mt-6 space-y-5">
              {conditions.map(([t, d]) => (
                <div key={t} className="rounded-xl border bg-card p-5">
                  <dt className="font-bold">{t}</dt>
                  <dd className="mt-1 text-muted-foreground">{d}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">
              Pronto para assinar?{" "}
              <Link to="/assinar" className="font-semibold text-primary hover:underline">
                Escolha seu plano oficial e pague com segurança
              </Link>
              . As credenciais são liberadas automaticamente após a confirmação do pagamento. Para
              dúvidas, escreva para contato@tvlebara.com.br.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
