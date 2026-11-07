// Dados públicos da TV Lebara. Preço é provisório: no checkout, o valor oficial virá do servidor.
export const company = {
  name: "TV Lebara",
  legalName: "CONFEDERAÇÃO BRASILEIRA DE UMBANDA E RELIGIÕES AFRODESCENDENTES HIRMA ELIANA",
  cnpj: "61.867.560/0001-32",
  email: "contato@tvlebara.com.br",
  instagram: "https://www.instagram.com/tv.lebara/",
  instagramHandle: "@tv.lebara",
  // WhatsApp de suporte: exibido apenas na área autenticada, para assinantes ativos.
  whatsapp: "5511942143068",
  whatsappDisplay: "(11) 94214-3068",
};

export type PlanTier = "premium" | "premium_plus";
export type BillingPeriod = "mensal" | "trimestral" | "semestral" | "anual";

export const periods: { value: BillingPeriod; label: string; months: number }[] = [
  { value: "mensal", label: "Mensal", months: 1 },
  { value: "trimestral", label: "Trimestral", months: 3 },
  { value: "semestral", label: "Semestral", months: 6 },
  { value: "anual", label: "Anual", months: 12 },
];

// TEST_MODE: while true, every option charges R$ 0,50. Real prices stay in `realPriceCents`.
export const TEST_MODE = false;
export const TEST_PRICE_CENTS = 50;

export const tiers: Record<PlanTier, { name: string; tvs: number; tvLabel: string; realPriceCents: Record<BillingPeriod, number> }> = {
  premium: { name: "Premium", tvs: 1, tvLabel: "1 TV", realPriceCents: { mensal: 3000, trimestral: 9000, semestral: 18000, anual: 36000 } },
  premium_plus: { name: "Premium Plus", tvs: 3, tvLabel: "3 TVs", realPriceCents: { mensal: 6000, trimestral: 18000, semestral: 36000, anual: 72900 } },
};

export const isTier = (v: unknown): v is PlanTier => v === "premium" || v === "premium_plus";
export const isPeriod = (v: unknown): v is BillingPeriod => periods.some((p) => p.value === v);
export const periodOf = (p: string) => periods.find((x) => x.value === p) ?? periods[0]!;
export function priceCents(tier: PlanTier, period: BillingPeriod) {
  return TEST_MODE ? TEST_PRICE_CENTS : tiers[tier].realPriceCents[period];
}
export function planName(tier: PlanTier, period: BillingPeriod) {
  return `TV Lebara | ${tiers[tier].name} ${periodOf(period).label} (${tiers[tier].tvLabel})`;
}

export const plan = {
  name: "TV Lebara | Premium",
  priceCents: tiers.premium.realPriceCents.mensal,
  interval: "mês",
  features: [
    "Acesso à área de assinantes",
    "Transmissões ao vivo disponíveis na programação",
    "Catálogo de conteúdos gravados incluídos",
    "Histórico de pagamentos e gestão da assinatura",
    "Atendimento via WhatsApp para assinantes ativos",
  ],
};

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const categories = [
  { slug: "umbanda", name: "Umbanda" },
  { slug: "candomble", name: "Candomblé" },
  { slug: "quimbanda", name: "Quimbanda" },
  { slug: "ifa", name: "Ìfá" },
  { slug: "jurema-sagrada", name: "Jurema Sagrada" },
  { slug: "entrevistas", name: "Entrevistas e conversas" },
  { slug: "palestras", name: "Palestras e estudos" },
  { slug: "podcasts", name: "Podcasts" },
  { slug: "cultura-e-memoria", name: "Cultura e memória" },
] as const;

export const faq = [
  { q: "O que é a TV Lebara?", a: "A TV Lebara é uma plataforma de streaming dedicada a conteúdos relacionados às religiões de matriz africana, reunindo programações ao vivo, entrevistas, palestras, podcasts e outros materiais." },
  { q: "Quais conteúdos posso encontrar?", a: "A programação pode incluir conteúdos relacionados à Umbanda, ao Candomblé, à Quimbanda, ao Ìfá, à Jurema Sagrada e a outras tradições, além de entrevistas, conversas e conteúdos culturais." },
  { q: "Quanto custa a assinatura?", a: "Premium (1 TV): Mensal R$ 30,00, Trimestral R$ 90,00, Semestral R$ 180,00, Anual R$ 360,00. Premium Plus (até 3 TVs): Mensal R$ 60,00, Trimestral R$ 180,00, Semestral R$ 360,00, Anual R$ 729,00." },
  { q: "A assinatura é renovada automaticamente?", a: "Sim. O plano mensal foi concebido com renovação automática, de acordo com as condições apresentadas antes do pagamento." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Você pode cancelar a renovação a qualquer momento pela sua área de assinante. Após o cancelamento, nenhuma nova cobrança é feita, e o acesso continua disponível até o fim do período que já foi pago." },
  { q: "Como faço para assistir?", a: "Após criar uma conta e contratar um plano, o assinante poderá entrar na plataforma e acessar os conteúdos incluídos na assinatura, utilizando um dispositivo e navegador compatíveis." },
  { q: "Posso assistir na minha TV?", a: "Sim. Além da live e dos conteúdos gravados no site, o Usuário Premium tem acesso IPTV para assistir à TV Lebara direto na televisão, por um aplicativo compatível." },
  { q: "Posso assistir aos conteúdos depois?", a: "Sim, aos conteúdos gravados que estiverem disponibilizados para a sua conta e incluídos no plano." },
  { q: "Os conteúdos têm classificação indicativa?", a: "Sim. Cada conteúdo informa sua classificação indicativa, para que famílias e responsáveis possam escolher o que assistir com tranquilidade." },
  { q: "Como entro em contato?", a: "O contato geral poderá ser realizado pelo e-mail contato@tvlebara.com.br. Assinantes ativos também terão acesso ao canal de suporte por WhatsApp dentro da área autenticada." },
];

// Programação de exemplo (fictícia) — será substituída pelo cadastro no painel administrativo.
export type ProgramStatus = "ao-vivo" | "em-breve" | "gravado";
export type Program = {
  slug: string; title: string; category: string; description: string;
  rating: "L" | "10" | "12" | "14" | "16" | "18"; status: ProgramStatus;
  day: string; time: string; duration: string; image: string; image_url?: string | null;
};

export const programs: Program[] = [
  { slug: "toque-de-atabaque", title: "Toque de Atabaque", category: "Candomblé", description: "Ogãs de diferentes casas mostram os ritmos, os toques e as histórias guardadas em cada instrumento.", rating: "L", status: "ao-vivo", day: "Hoje", time: "19:00", duration: "60 min", image: "p1" },
  { slug: "vozes-de-terreiro", title: "Vozes de Terreiro", category: "Podcasts", description: "Conversas francas entre mulheres de axé sobre fé, família, trabalho e o cotidiano das tradições.", rating: "12", status: "em-breve", day: "Hoje", time: "21:00", duration: "50 min", image: "p2" },
  { slug: "palavra-dos-mais-velhos", title: "Palavra dos Mais Velhos", category: "Palestras e estudos", description: "Babalorixás, ialorixás e pais de santo compartilham ensinamentos aprendidos ao longo de décadas.", rating: "L", status: "em-breve", day: "Amanhã", time: "20:00", duration: "75 min", image: "p3" },
  { slug: "saberes-da-jurema", title: "Saberes da Jurema", category: "Jurema Sagrada", description: "Uma viagem pelo Nordeste para conhecer ervas, cantos e a memória dos mestres e mestras juremeiros.", rating: "10", status: "gravado", day: "Sábado", time: "18:00", duration: "45 min", image: "p4" },
  { slug: "roda-de-conversa", title: "Roda de Conversa", category: "Entrevistas e conversas", description: "Convidados de várias tradições se encontram para debater temas atuais com respeito às diferenças.", rating: "12", status: "gravado", day: "Domingo", time: "16:00", duration: "90 min", image: "studio" },
  { slug: "umbanda-de-raiz", title: "Umbanda de Raiz", category: "Umbanda", description: "A história da Umbanda contada por quem a vive: origens, linhas de trabalho e a caridade no dia a dia.", rating: "L", status: "em-breve", day: "Segunda", time: "20:00", duration: "60 min", image: "hero" },
];

export const newsKinds = [
  { value: "noticia", label: "Notícia" },
  { value: "novidade", label: "Novidade" },
  { value: "podcast", label: "Podcast" },
  { value: "bate-papo", label: "Bate-papo" },
  { value: "aula", label: "Aula" },
  { value: "programacao-ao-vivo", label: "Programação ao vivo" },
] as const;
export const newsKindLabel = (k: string) => newsKinds.find((n) => n.value === k)?.label ?? k;
