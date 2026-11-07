import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/site/PageShell";
import { company } from "@/lib/site";
import studio from "@/assets/studio.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a TV Lebara — Cultura, memória e conhecimento" },
      { name: "description", content: "Conheça o propósito da TV Lebara: ampliar o acesso a conteúdos sobre as tradições de matriz africana." },
      { property: "og:title", content: "Sobre a TV Lebara" },
      { property: "og:description", content: "Um canal de conteúdo, aprendizado, diálogo e memória das tradições de matriz africana." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <>
      <PageIntro eyebrow="Conheça" title="Uma iniciativa dedicada à cultura, à memória e ao conhecimento" />
      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5 text-lg leading-relaxed">
            <p>A TV Lebara é um canal de streaming pensado para quem quer ouvir, aprender e compartilhar o que as tradições de matriz africana guardam: histórias, ensinamentos, cantos, memórias e modos de viver.</p>
            <p>Reunimos transmissões ao vivo, entrevistas, rodas de conversa, palestras e podcasts. Cada tradição tem seus fundamentos, e nós tratamos Umbanda, Candomblé, Quimbanda, Ìfá, Jurema Sagrada e outras com o respeito que suas diferenças pedem.</p>
            <p>Queremos que os mais velhos se sintam acolhidos, que os mais novos encontrem um lugar para descobrir, e que quem nunca teve contato com esses saberes possa conhecê-los com seriedade.</p>
            <p className="text-base text-muted-foreground">A TV Lebara é operada pela {company.legalName}, CNPJ {company.cnpj}.</p>
            <Button asChild size="lg"><Link to="/planos">Quero assinar</Link></Button>
          </div>
          <img src={studio} alt="Entrevista em estúdio da TV Lebara" loading="lazy" width={1280} height={960} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
        </div>
      </section>
    </>
  );
}
