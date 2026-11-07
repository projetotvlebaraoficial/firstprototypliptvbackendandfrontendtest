import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMpPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env["MERCADO_PAGO_PUBLIC_KEY"] ?? null };
});

async function payerFor(supabase: any, userId: string, email?: string) {
  const { data: prof } = await supabase.from("profiles").select("full_name,cpf").eq("id", userId).maybeSingle();
  const cpf = (prof?.cpf ?? "").replace(/\D/g, "");
  if (cpf.length !== 11) throw new Error("Complete seu perfil (CPF) antes de assinar.");
  const [first, ...rest] = (prof?.full_name ?? "Assinante").trim().split(/\s+/);
  return {
    email,
    first_name: first,
    last_name: rest.join(" ") || first,
    identification: { type: "CPF", number: cpf },
  };
}

function notificationUrl() {
  const base = process.env["PUBLIC_SITE_URL"] ?? "https://firstprototypliptvbackendandfrontendtest.lovable.app";
  return `${base}/api/public/mercadopago/webhook`;
}

const planInput = z.object({ tier: z.enum(["premium", "premium_plus"]), period: z.enum(["mensal", "trimestral", "semestral", "anual"]) });

async function rememberChoice(userId: string, tier: string, period: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("subscriptions").update({ pending_tier: tier, pending_period: period, updated_at: new Date().toISOString() }).eq("user_id", userId);
}

export const createPixPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => planInput.parse(d))
  .handler(async ({ data, context }) => {
    const { mpFetch, syncPayment, resolvePlan } = await import("./mercadopago.server");
    const plan = resolvePlan(data.tier, data.period);
    const email = (context.claims as any)?.email as string | undefined;
    const payer = await payerFor(context.supabase, context.userId, email);
    const p = await mpFetch("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({
        transaction_amount: plan.cents / 100,
        description: plan.name,
        metadata: { tier: plan.tier, period: plan.period },
        payment_method_id: "pix",
        payer,
        external_reference: context.userId,
        notification_url: notificationUrl(),
      }),
    });
    await rememberChoice(context.userId, plan.tier, plan.period);
    await syncPayment(String(p.id));
    const tx = p.point_of_interaction?.transaction_data ?? {};
    return { id: String(p.id), qrCode: tx.qr_code as string, qrBase64: tx.qr_code_base64 as string };
  });

export const createCardPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      token: z.string().min(10).max(200),
      paymentMethodId: z.string().min(2).max(40),
      issuerId: z.string().max(40).optional(),
      installments: z.number().int().min(1).max(12),
    }).merge(planInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { mpFetch, syncPreapproval, resolvePlan } = await import("./mercadopago.server");
    const plan = resolvePlan(data.tier, data.period);
    const email = (context.claims as any)?.email as string | undefined;
    if (!email) throw new Error("Conta sem e-mail.");
    await payerFor(context.supabase, context.userId, email);
    await rememberChoice(context.userId, plan.tier, plan.period);
    // Recurring subscription: Mercado Pago charges the card automatically every month.
    const pre = await mpFetch("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: plan.name,
        external_reference: context.userId,
        payer_email: email,
        card_token_id: data.token,
        status: "authorized",
        back_url: (process.env["PUBLIC_SITE_URL"] ?? "https://firstprototypliptvbackendandfrontendtest.lovable.app") + "/assinatura",
        auto_recurring: {
          frequency: plan.months,
          frequency_type: "months",
          transaction_amount: plan.cents / 100,
          currency_id: "BRL",
        },
      }),
    });
    await syncPreapproval(String(pre.id));
    const ok = pre.status === "authorized";
    return { id: String(pre.id), status: ok ? "approved" : pre.status, detail: ok ? "recurring" : undefined };
  });

export const setAutoRenewal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ cancel: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: sub } = await context.supabase.from("subscriptions").select("mp_preapproval_id").eq("user_id", context.userId).maybeSingle();
    const { mpFetch } = await import("./mercadopago.server");
    if (sub?.mp_preapproval_id) {
      await mpFetch(`/preapproval/${encodeURIComponent(sub.mp_preapproval_id)}`, {
        method: "PUT",
        body: JSON.stringify({ status: data.cancel ? "paused" : "authorized" }),
      });
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("subscriptions").update({ cancel_at_period_end: data.cancel }).eq("user_id", context.userId);
    return { ok: true };
  });

export const checkPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().regex(/^\d{1,20}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    // Only allow checking own payments
    const { data: row } = await context.supabase.from("payments").select("id").eq("provider_payment_id", data.id).maybeSingle();
    if (!row) return { status: "unknown" };
    const { syncPayment } = await import("./mercadopago.server");
    return syncPayment(data.id);
  });
