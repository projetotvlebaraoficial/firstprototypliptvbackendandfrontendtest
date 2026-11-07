import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Mail, MessageCircle } from "lucide-react";
import { AccountShell, Panel } from "@/components/site/AccountShell";
import { Button } from "@/components/ui/button";
import { accountQuery } from "@/lib/account";
import { company } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/suporte")({
  head: () => ({ meta: [{ title: "Suporte — TV Lebara" }, { name: "description", content: "Atendimento ao assinante." }, { property: "og:title", content: "Suporte — TV Lebara" }, { property: "og:description", content: "Atendimento ao assinante." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: Support,
});

function Support() {
  const { data } = useSuspenseQuery(accountQuery);
  const active = data.subscription?.status === "ativa";
  return (
    <AccountShell title="Suporte" subtitle="Estamos aqui para ajudar.">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <MessageCircle className="h-7 w-7 text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold">WhatsApp do assinante</h2>
          {active ? (
            <>
              <p className="mt-2 text-muted-foreground">Atendimento exclusivo para assinantes ativos:</p>
              <Button asChild className="mt-4 rounded-full">
                <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Chamar no WhatsApp {company.whatsappDisplay}
                </a>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-muted-foreground">Disponível para assinantes ativos.</p>
              <Button asChild className="mt-4 rounded-full"><Link to="/checkout">Ativar assinatura</Link></Button>
            </>
          )}
        </Panel>
        <Panel>
          <Mail className="h-7 w-7 text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold">E-mail</h2>
          <p className="mt-2 text-muted-foreground">Para dúvidas gerais, escreva para:</p>
          <a href={`mailto:${company.email}`} className="mt-2 inline-block font-semibold text-primary">{company.email}</a>
        </Panel>
      </div>
    </AccountShell>
  );
}
