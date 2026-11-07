import { createFileRoute } from "@tanstack/react-router";

// Mercado Pago notification. We never trust the body: the payment is re-read
// from Mercado Pago with our access token before anything changes.
export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let id = url.searchParams.get("data.id") ?? url.searchParams.get("id");
        let type = url.searchParams.get("type") ?? url.searchParams.get("topic");
        try {
          const body = await request.json();
          id = body?.data?.id ?? id;
          type = body?.type ?? body?.topic ?? type;
        } catch { /* empty body */ }
        if (!id || !/^[0-9a-zA-Z]{1,40}$/.test(String(id))) return new Response("ignored");
        try {
          const mp = await import("@/lib/mercadopago.server");
          if (type === "payment") await mp.syncPayment(String(id));
          else if (type === "subscription_preapproval") await mp.syncPreapproval(String(id));
          else if (type === "subscription_authorized_payment") await mp.syncAuthorizedPayment(String(id));
          else return new Response("ignored");
        } catch (e) {
          console.error("webhook sync failed", e);
          return new Response("error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
