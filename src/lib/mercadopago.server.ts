// Server-only helpers for Mercado Pago. Never import from client code.
import {
  isPeriod,
  isTier,
  periodOf,
  planName,
  priceCents,
  type BillingPeriod,
  type PlanTier,
} from "./site";

export function resolvePlan(
  tier: unknown,
  period: unknown,
): { tier: PlanTier; period: BillingPeriod; cents: number; name: string; months: number } {
  const t: PlanTier = isTier(tier) ? tier : "premium";
  const p: BillingPeriod = isPeriod(period) ? period : "mensal";
  return {
    tier: t,
    period: p,
    cents: priceCents(t, p),
    name: planName(t, p),
    months: periodOf(p).months,
  };
}

type MpPayment = {
  id: number;
  status: string;
  transaction_amount: number;
  payment_method_id?: string;
  external_reference?: string;
  metadata?: { tier?: string; period?: string } | null;
  date_approved?: string | null;
};

export function mpToken() {
  const t = (process.env["MERCADO_PAGO_ACCESS_TOKEN"] ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!t) throw new Error("Mercado Pago não configurado.");
  return t;
}

export async function mpFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${mpToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Mercado Pago error", res.status, JSON.stringify(body).slice(0, 500));
    throw new Error("Não foi possível processar o pagamento. Tente novamente.");
  }
  return body;
}

/** Re-reads a payment from Mercado Pago (source of truth) and syncs our DB. */
export async function syncPayment(paymentId: string) {
  const p = (await mpFetch(`/v1/payments/${encodeURIComponent(paymentId)}`)) as MpPayment;
  const userId = p.external_reference;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return { status: p.status };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const pid = String(p.id);

  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id,status")
    .eq("provider_payment_id", pid)
    .maybeSingle();
  const wasApproved = existing?.status === "approved";
  const row = {
    user_id: userId,
    amount_cents: Math.round(p.transaction_amount * 100),
    status: p.status,
    method: p.payment_method_id === "pix" ? "pix" : "cartao",
    paid_at: p.status === "approved" ? (p.date_approved ?? new Date().toISOString()) : null,
    provider_payment_id: pid,
    updated_at: new Date().toISOString(),
  };
  if (existing) await supabaseAdmin.from("payments").update(row).eq("id", existing.id);
  else await supabaseAdmin.from("payments").insert(row);

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("current_period_end,status,plan_tier,billing_period,pending_tier,pending_period")
    .eq("user_id", userId)
    .maybeSingle();
  const chosen = resolvePlan(
    p.metadata?.tier ?? sub?.pending_tier ?? sub?.plan_tier,
    p.metadata?.period ?? sub?.pending_period ?? sub?.billing_period,
  );
  const approved =
    p.status === "approved" && Math.round(p.transaction_amount * 100) >= chosen.cents;

  if (approved && !wasApproved) {
    const now = Date.now();
    const curEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : 0;
    const base = sub?.status === "ativa" && curEnd > now ? curEnd : now;
    const end = new Date(base + chosen.months * 30 * 86400000).toISOString();
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        status: "ativa",
        plan_tier: chosen.tier,
        billing_period: chosen.period,
        plan_name: chosen.name,
        price_cents: chosen.cents,
        pending_tier: null,
        pending_period: null,
        current_period_end: end,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  // Official Horizon credentials are released ONLY after the gateway confirms
  // the payment. This call is idempotent: active accounts are returned as-is
  // and repeated webhook notifications do not create a second account.
  if (approved) {
    try {
      const { ensureHorizonAccountForUser } = await import("./horizon-accounts.server");
      await ensureHorizonAccountForUser({
        userId,
        tier: chosen.tier,
        period: chosen.period,
        paymentId: pid,
      });
    } catch (error) {
      console.error("[TV Lebara] Account creation failed", error);
    }
  }

  return { status: p.status };
}

/** Syncs a recurring subscription (preapproval) status from Mercado Pago. */
export async function syncPreapproval(preapprovalId: string) {
  const pre = await mpFetch(`/preapproval/${encodeURIComponent(preapprovalId)}`);
  const userId = pre.external_reference as string | undefined;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return { status: pre.status };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("subscriptions")
    .update({
      mp_preapproval_id: String(pre.id),
      cancel_at_period_end: pre.status !== "authorized",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  return { status: pre.status as string };
}

/** Handles a monthly automatic charge notification. */
export async function syncAuthorizedPayment(id: string) {
  const ap = await mpFetch(`/authorized_payments/${encodeURIComponent(id)}`);
  const paymentId = ap?.payment?.id;
  if (paymentId) await syncPayment(String(paymentId));
  if (ap?.preapproval_id) await syncPreapproval(String(ap.preapproval_id));
}
