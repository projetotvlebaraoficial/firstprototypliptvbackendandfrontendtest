import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site/PageShell";
import { FaqList } from "@/components/site/FaqList";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — TV Lebara" },
      { name: "description", content: "Tire suas dúvidas sobre a TV Lebara: conteúdos, assinatura, renovação, cancelamento e como assistir." },
      { property: "og:title", content: "Perguntas frequentes — TV Lebara" },
      { property: "og:description", content: "Respostas claras sobre a assinatura e os conteúdos da TV Lebara." },
    ],
  }),
  component: () => (
    <>
      <PageIntro eyebrow="Ajuda" title="Perguntas frequentes" />
      <section className="container-page max-w-3xl py-16"><FaqList /></section>
    </>
  ),
});
