import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CreditCard, QrCode, ShieldCheck, Lock, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatBRL,
  isPeriod,
  isTier,
  periods,
  plan,
  planName,
  priceCents,
  tiers,
  type BillingPeriod,
  type PlanTier,
} from "@/lib/site";
import { Tv } from "lucide-react";
import {
  checkPayment,
  createCardPayment,
  createPixPayment,
  getMpPublicKey,
} from "@/lib/payments.functions";
import { friendlyErrorMessage } from "@/lib/user-errors";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar assinatura — TV Lebara" },
      { name: "description", content: "Conclua sua assinatura TV Lebara." },
      { property: "og:title", content: "Finalizar assinatura — TV Lebara" },
      { property: "og:description", content: "Conclua sua assinatura." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (
    s: Record<string, unknown>,
  ): { plano?: PlanTier | undefined; periodo?: BillingPeriod | undefined } => ({
    plano: isTier(s["plano"]) ? s["plano"] : undefined,
    periodo: isPeriod(s["periodo"]) ? s["periodo"] : undefined,
  }),
  component: Checkout,
});

type MercadoPagoInstance = {
  getPaymentMethods: (input: { bin: string }) => Promise<{
    results?: { id: string; issuer?: { id?: string | number } | null }[];
  }>;
  createCardToken: (input: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<{ id: string }>;
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

function loadMpSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar Mercado Pago"));
    document.head.appendChild(s);
  });
}

const digits = (v: string) => v.replace(/\D/g, "");

function Checkout() {
  const search = Route.useSearch();
  const [tier, setTier] = useState<PlanTier>(search.plano ?? "premium");
  const [period, setPeriod] = useState<BillingPeriod>(search.periodo ?? "mensal");
  const total = priceCents(tier, period);
  const months = periods.find((p) => p.value === period)!.months;
  const [method, setMethod] = useState<"pix" | "cartao">("pix");
  const [busy, setBusy] = useState(false);
  const [pix, setPix] = useState<{ id: string; qrCode: string; qrBase64: string } | null>(null);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "", cpf: "" });
  const mpRef = useRef<MercadoPagoInstance | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pixFn = useServerFn(createPixPayment);
  const cardFn = useServerFn(createCardPayment);
  const checkFn = useServerFn(checkPayment);
  const keyFn = useServerFn(getMpPublicKey);

  const success = async () => {
    await qc.invalidateQueries();
    toast.success("Pagamento aprovado! Estamos preparando suas credenciais oficiais.");
    navigate({ to: "/minha-conta" });
  };

  // Poll Pix status
  useEffect(() => {
    if (!pix) return;
    const t = setInterval(async () => {
      try {
        const r = await checkFn({ data: { id: pix.id } });
        if (r.status === "approved") {
          clearInterval(t);
          success();
        }
      } catch {
        /* keep polling */
      }
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix]);

  const getMp = async () => {
    if (mpRef.current) return mpRef.current;
    const { publicKey } = await keyFn();
    if (!publicKey) throw new Error("Pagamento por cartão ainda não configurado.");
    await loadMpSdk();
    const MercadoPago = window.MercadoPago;
    if (!MercadoPago) throw new Error("Falha ao carregar Mercado Pago");
    mpRef.current = new MercadoPago(publicKey, { locale: "pt-BR" });
    return mpRef.current;
  };

  const payPix = async () => {
    setBusy(true);
    try {
      setPix(await pixFn({ data: { tier, period } }));
    } catch (e) {
      toast.error(
        friendlyErrorMessage(e, "Não foi possível gerar o Pix. Tente novamente em instantes."),
      );
    } finally {
      setBusy(false);
    }
  };

  const payCard = async () => {
    const num = digits(card.number);
    const [mm, yy] = card.exp.split("/");
    if (
      num.length < 13 ||
      !card.name ||
      !mm ||
      !yy ||
      digits(card.cvv).length < 3 ||
      digits(card.cpf).length !== 11
    ) {
      toast.error("Preencha todos os dados do cartão corretamente.");
      return;
    }
    setBusy(true);
    try {
      const mp = await getMp();
      const pm = await mp.getPaymentMethods({ bin: num.slice(0, 8) });
      const m = pm?.results?.[0];
      if (!m) throw new Error("Cartão não reconhecido.");
      const token = await mp.createCardToken({
        cardNumber: num,
        cardholderName: card.name,
        cardExpirationMonth: mm.padStart(2, "0"),
        cardExpirationYear: yy.length === 2 ? `20${yy}` : yy,
        securityCode: digits(card.cvv),
        identificationType: "CPF",
        identificationNumber: digits(card.cpf),
      });
      const r = await cardFn({
        data: {
          token: token.id,
          paymentMethodId: m.id,
          issuerId: m.issuer?.id ? String(m.issuer.id) : undefined,
          installments: 1,
          tier,
          period,
        },
      });
      if (r.status === "approved") {
        toast.success("Pagamento aprovado! Estamos preparando suas credenciais oficiais.");
        await qc.invalidateQueries();
        navigate({ to: "/minha-conta" });
      } else if (r.status === "in_process" || r.status === "pending")
        toast.info("Pagamento em análise. Avisaremos quando for aprovado.");
      else toast.error("Pagamento recusado. Confira os dados ou tente outro cartão.");
    } catch (e) {
      toast.error(
        friendlyErrorMessage(
          e,
          "Não foi possível processar o cartão. Tente novamente em instantes.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const fmtCard = (v: string) =>
    digits(v)
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  const fmtExp = (v: string) => {
    const d = digits(v).slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const fmtCpf = (v: string) =>
    digits(v)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  return (
    <section className="px-3 pb-20 pt-24 md:px-5 md:pt-28">
      <div className="mx-auto max-w-6xl">
        <Link to="/minha-conta" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para minha conta
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
          Finalizar assinatura
        </h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border bg-card p-6 shadow-soft md:p-8">
            <h2 className="font-display text-xl font-bold">1. Escolha seu plano</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(tiers) as PlanTier[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={!!pix}
                  onClick={() => setTier(k)}
                  className={`rounded-2xl border p-4 text-left transition ${tier === k ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-primary/50"}`}
                >
                  <p className="font-display text-lg font-bold">{tiers[k].name}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-extrabold text-primary">
                    <Tv className="h-4 w-4" />
                    {k === "premium_plus" ? "Até 3 TVs" : "1 TV"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    + Conteúdos no site · a partir de {formatBRL(tiers[k].realPriceCents.mensal)}
                    /mês
                  </p>
                </button>
              ))}
            </div>
            <h2 className="mt-8 font-display text-xl font-bold">2. Escolha o período</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {periods.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={!!pix}
                  onClick={() => setPeriod(p.value)}
                  className={`rounded-2xl border p-3 text-center transition ${period === p.value ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-primary/50"}`}
                >
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-sm text-primary font-bold">
                    {formatBRL(priceCents(tier, p.value))}
                  </p>
                  {priceCents(tier, p.value) !== tiers[tier].realPriceCents[p.value] && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatBRL(tiers[tier].realPriceCents[p.value])}
                    </p>
                  )}
                </button>
              ))}
            </div>
            <h2 className="mt-8 font-display text-xl font-bold">3. Forma de pagamento</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  ["pix", "Pix", QrCode],
                  ["cartao", "Cartão de crédito", CreditCard],
                ] as const
              ).map(([k, l, Icon]) => (
                <button
                  key={k}
                  onClick={() => setMethod(k)}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left font-semibold ${method === k ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <Icon className="h-5 w-5 text-primary" />
                  {l}
                </button>
              ))}
            </div>
            {method === "pix" ? (
              <div className="mt-6 rounded-2xl bg-muted p-6 text-center">
                {pix ? (
                  <>
                    <img
                      src={`data:image/png;base64,${pix.qrBase64}`}
                      alt="QR Code Pix"
                      className="mx-auto h-56 w-56 rounded-xl bg-card p-2"
                    />
                    <p className="mt-4 text-sm font-semibold">
                      Escaneie o QR Code no app do seu banco
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Input readOnly value={pix.qrCode} className="h-11 text-xs" />
                      <Button
                        variant="outline"
                        className="h-11"
                        onClick={() => {
                          navigator.clipboard.writeText(pix.qrCode);
                          toast.success("Código Pix copiado");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aguardando pagamento… a liberação é automática.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto grid h-40 w-40 place-items-center rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground">
                      <QrCode className="h-12 w-12" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Ao confirmar, um código Pix será gerado para pagamento.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Número do cartão</Label>
                  <Input
                    inputMode="numeric"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                    placeholder="0000 0000 0000 0000"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Nome impresso no cartão</Label>
                  <Input
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input
                    inputMode="numeric"
                    value={card.exp}
                    onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })}
                    placeholder="MM/AA"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input
                    inputMode="numeric"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: digits(e.target.value).slice(0, 4) })}
                    placeholder="123"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>CPF do titular</Label>
                  <Input
                    inputMode="numeric"
                    value={card.cpf}
                    onChange={(e) => setCard({ ...card, cpf: fmtCpf(e.target.value) })}
                    placeholder="000.000.000-00"
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
            )}
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Pagamento processado com segurança pelo Mercado Pago.
            </p>
          </div>
          <aside className="h-fit rounded-3xl border bg-card p-6 shadow-lift md:p-8">
            <p className="text-sm text-muted-foreground">Resumo</p>
            <p className="mt-1 font-display text-lg font-bold">{planName(tier, period)}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-extrabold text-primary-foreground">
              <Tv className="h-4 w-4" />
              IPTV para {tiers[tier].tvLabel}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-end justify-between border-t pt-4">
              <span className="text-muted-foreground">
                Total {periods.find((p) => p.value === period)!.label.toLowerCase()}
              </span>
              <span className="font-display text-3xl font-extrabold text-primary">
                {formatBRL(total)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Cada pagamento libera {months * 30} dias de acesso {tiers[tier].name}. Ao assinar,
              você concorda com os{" "}
              <Link to="/termos" className="underline">
                Termos de Uso
              </Link>
              .
            </p>
            <Button
              size="lg"
              className="mt-5 w-full rounded-full"
              disabled={busy || (method === "pix" && !!pix)}
              onClick={method === "pix" ? payPix : payCard}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : method === "pix" ? (
                "Gerar Pix"
              ) : (
                "Assinar com cobrança automática"
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Ambiente seguro
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Seu usuário e senha do IPTV são liberados em Minha conta automaticamente após a
              confirmação do pagamento.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
