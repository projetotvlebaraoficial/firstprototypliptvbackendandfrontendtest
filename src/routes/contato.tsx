import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { PageIntro } from "@/components/site/PageShell";
import { company } from "@/lib/site";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — TV Lebara" },
      { name: "description", content: "Canais oficiais de contato da TV Lebara." },
      { property: "og:title", content: "Fale com a TV Lebara" },
      { property: "og:description", content: "E-mail oficial e atendimento para assinantes." },
    ],
  }),
  component: () => (
    <>
      <PageIntro eyebrow="Contato" title="Fale com a gente">Responderemos o mais breve possível.</PageIntro>
      <section className="container-page grid gap-5 py-16 md:grid-cols-2">
        <a href={`mailto:${company.email}`} className="card-hover rounded-2xl border bg-card p-8">
          <Mail className="h-7 w-7 text-primary" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">E-mail</h2>
          <p className="mt-1 text-lg text-primary">{company.email}</p>
          <p className="mt-2 text-muted-foreground">Dúvidas gerais, imprensa, parcerias e privacidade.</p>
        </a>
        <div className="rounded-2xl border bg-card p-8">
          <MessageCircle className="h-7 w-7 text-primary" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">WhatsApp para assinantes</h2>
          <p className="mt-2 text-muted-foreground">Assinantes ativos encontram o atendimento por WhatsApp dentro da área de assinante.</p>
        </div>
      </section>
    </>
  ),
});
