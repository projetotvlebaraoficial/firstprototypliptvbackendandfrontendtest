import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageShell";
import { SiteSignupForm } from "@/components/site/SiteSignupForm";
import { HORIZON_TRIAL_HOURS } from "@/lib/horizon";

export const Route = createFileRoute("/teste-gratis")({
  head: () => ({
    meta: [
      { title: `Criar conta e testar grátis ${HORIZON_TRIAL_HOURS}h — TV Lebara` },
      {
        name: "description",
        content: `Crie sua conta gratuita na TV Lebara e libere o teste de ${HORIZON_TRIAL_HOURS} horas dentro do painel do assinante.`,
      },
      {
        property: "og:title",
        content: `Criar conta e testar grátis ${HORIZON_TRIAL_HOURS}h — TV Lebara`,
      },
      {
        property: "og:description",
        content: "Cadastro gratuito. O teste de 4 horas é gerado no painel do assinante.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <>
      <PageIntro eyebrow="Criar conta" title="Crie sua conta gratuita na TV Lebara">
        Faça seu cadastro no site. Depois de entrar, você poderá gerar o teste grátis de{" "}
        {HORIZON_TRIAL_HOURS} horas ou assinar um plano oficial no painel do assinante.
      </PageIntro>

      <section className="py-16">
        <div className="container-page max-w-3xl">
          <SiteSignupForm />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">1. Crie sua conta</p>
              <p className="mt-2">
                O cadastro é gratuito e usa seu e-mail. Nome, WhatsApp e CPF ficam salvos no seu
                perfil para liberar o teste e a assinatura.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">2. Use o painel do assinante</p>
              <p className="mt-2">
                Em{" "}
                <Link to="/minha-conta" className="font-semibold text-primary hover:underline">
                  Minha conta
                </Link>{" "}
                você gera o teste de {HORIZON_TRIAL_HOURS} horas (1 vez por perfil e por CPF) ou
                assina um plano oficial.
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link
              to="/auth"
              search={{ modo: "entrar", redirect: "/minha-conta" }}
              className="font-semibold text-primary hover:underline"
            >
              Entre aqui
            </Link>
            . As credenciais oficiais do IPTV são liberadas automaticamente somente após a
            confirmação do pagamento.
          </p>
        </div>
      </section>
    </>
  );
}
