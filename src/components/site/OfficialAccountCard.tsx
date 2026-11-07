import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ArrowRight, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/site/AccountShell";
import { CredentialsCard } from "@/components/site/CredentialsCard";
import { accountQuery } from "@/lib/account";
import type { HorizonAccountStatus } from "@/lib/horizon";
import { getAccountHorizonStatus, retryAccountHorizon } from "@/lib/horizon.functions";
import { friendlyErrorMessage } from "@/lib/user-errors";

export function OfficialAccountCard() {
  const { data: account } = useSuspenseQuery(accountQuery);
  const getStatus = useServerFn(getAccountHorizonStatus);
  const retry = useServerFn(retryAccountHorizon);

  const [state, setState] = useState<HorizonAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = account.subscription?.status === "ativa";

  const load = useCallback(async () => {
    try {
      const value = await getStatus();
      setState(value);
      setError(null);
    } catch (err) {
      // A status lookup failure must not break the account page. Keep the last
      // known state (if any) and log the technical detail on the client only.
      console.error("[TV Lebara] Falha ao consultar a conta oficial.", err);
      setState(
        (current) =>
          current ?? {
            status: "none",
            credentials: null,
            message:
              "Sua assinatura oficial TV Lebara e credenciais de acesso serão liberadas automaticamente nesta área assim que o pagamento for confirmado.",
            error: null,
            planName: null,
            updatedAt: null,
          },
      );
    } finally {
      setLoading(false);
    }
  }, [getStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  // While the webhook is creating the account, keep checking so the
  // credentials appear without the customer reloading the page.
  useEffect(() => {
    if (state?.status !== "pending") return;
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, [state?.status, load]);

  async function handleRetry() {
    setRetrying(true);
    setError(null);
    try {
      const result = await retry();
      setState(result);
      if (result.status === "active") toast.success("Credenciais oficiais liberadas!");
      else if (result.status === "failed")
        toast.error(
          friendlyErrorMessage(
            result.message,
            "Não foi possível liberar suas credenciais agora. Tente novamente em instantes.",
          ),
        );
      else toast.info(result.message);
    } catch (err) {
      console.error("[TV Lebara] Falha ao liberar as credenciais oficiais.", err);
      setError("Não foi possível liberar suas credenciais agora. Tente novamente em instantes.");
    } finally {
      setRetrying(false);
    }
  }

  if (loading && !state && !error) {
    if (!active) return null;
    return (
      <Panel className="mb-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Consultando sua conta oficial...
        </p>
      </Panel>
    );
  }

  if (state?.status === "active" && state.credentials) {
    return (
      <div className="mb-6">
        <CredentialsCard credentials={state.credentials} trial={false} />
      </div>
    );
  }

  if (!active && !state && !error) return null;

  const failed = state?.status === "failed";
  const pending = state?.status === "pending";
  const message = friendlyErrorMessage(
    state?.message ?? error,
    "Sua assinatura está ativa. Estamos aguardando a confirmação do pagamento para liberar as credenciais.",
  );

  return (
    <Panel className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            {failed ? <AlertCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Acesso oficial</p>
            <h2 className="font-display text-xl font-bold">
              {pending ? "Preparando suas credenciais" : "Sua conta oficial TV Lebara"}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{message}</p>
            {failed && (
              <p className="mt-2 text-xs text-muted-foreground">
                Se faltar algum dado, complete seu perfil e tente novamente.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {pending && (
            <Button type="button" variant="outline" className="rounded-full" disabled>
              <Loader2 className="h-4 w-4 animate-spin" /> Criando acesso...
            </Button>
          )}
          {(failed || (!pending && active)) && (
            <Button
              type="button"
              className="rounded-full"
              disabled={retrying}
              onClick={() => void handleRetry()}
            >
              {retrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Tentando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" /> Liberar credenciais
                </>
              )}
            </Button>
          )}
          {failed && (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/perfil">
                Completar perfil <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">{error}</p>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Sua assinatura oficial TV Lebara e credenciais de acesso serão liberadas automaticamente
        nesta área assim que o pagamento for confirmado.
      </p>
    </Panel>
  );
}
