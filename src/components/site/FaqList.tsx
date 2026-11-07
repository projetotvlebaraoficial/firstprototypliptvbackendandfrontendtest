import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faq } from "@/lib/site";

export function FaqList({ limit }: { limit?: number }) {
  return (
    <Accordion type="single" collapsible className="rounded-2xl border bg-card px-6">
      {faq.slice(0, limit).map((f, i) => (
        <AccordionItem key={f.q} value={`q${i}`}>
          <AccordionTrigger className="py-5 text-left text-lg font-semibold hover:no-underline hover:text-primary">{f.q}</AccordionTrigger>
          <AccordionContent className="pb-5 text-base text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
