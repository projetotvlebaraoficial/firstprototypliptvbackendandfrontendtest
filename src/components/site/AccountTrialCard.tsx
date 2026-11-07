import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Clock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/site/AccountShell";
import { HorizonSignupForm } from "@/components/site/HorizonSignupForm";
import { accountQuery } from "@/lib/account";
import {
  HORIZON_TRIAL_HOURS,
  type HorizonCredentials,
  type HorizonTrialStatus,
} from "@/lib/horizon";
import { getAccountTrialStatus, requestAccountTrial } from "@/lib/horizon.functions";
import { resetAccountTrial } from "@/lib/horizon-dev.functions";
import {
  friendlyErrorMessage,
  isServiceConfigError,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "@/lib/user-errors";

const GENERATE_LABEL = `Gerar Teste Grátis de ${HORIZON_TRIAL_HOURS} Horas`;
const GENERIC_ERROR = "Não foi possível gerar o teste grátis agora. Tente novamente em instantes.";
const ALREADY_USED_MESSAGE =
  "Você já utilizou o teste grátis de 4 horas. Para continuar assistindo, assine um plano oficial.";

function optimisticAllowed(): HorizonTrialStatus {
  return {
    allowed: true,
    reason: "allowed",
    message: `Você pode gerar agora seu teste grátis de ${HORIZON_TRIAL_HOURS} horas.`,
    trial: null,
    completedAt: null,
  };
}

function alreadyUsedStatus(trial: HorizonCredentials | null): HorizonTrialStatus {
  return {
    allowed: false,
    reason: "already_used",
    message: ALREADY_USED_MESSAGE,
    trial,
    completedAt: null,
  };
}

function safeErrorMessage(error: unknown) {
  const message = friendlyErrorMessage(error, GENERIC_ERROR);
  return message === SERVICE_UNAVAILABLE_MESSAGE || isServiceConfigError(error)
    ? GENERIC_ERROR
    : message;
}

export function AccountTrialCard() {
  const { data: account } = useSuspenseQuery(accountQuery);
  const getStatus = useServerFn(getAccountTrialStatus);
  const requestTrial = useServerFn(requestAccountTrial);
  const resetTrialRequest = useServerFn(resetAccountTrial);

  const [status, setStatus] = useState<HorizonTrialStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [credentials, setCredentials] = useState<HorizonCredentials | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingStatus(true);
    getStatus()
      .then((value) => {
        if (!cancelled) setStatus(value);
      })
      .catch((err) => {
        // Never block the card because the status lookup failed. The button
        // stays available and the generation handler validates the profile.
        console.error("[TV Lebara] Falha ao consultar o teste grátis.", err);
        if (!cancelled) setStatus(optimisticAllowed());
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, [getStatus]);

  async function generateTrial() {
    setRequesting(true);
    setError(null);
    try {
      const result = await requestTrial();
      if (result.ok) {
        setCredentials(result.credentials);
        setJustGenerated(true);
        setStatus(alreadyUsedStatus(result.credentials));
        toast.success(result.message || `Teste grátis de ${HORIZON_TRIAL_HOURS} horas liberado!`);
        return;
      }

      if (result.code === "trial_used") {
        setStatus(alreadyUsedStatus(null));
        toast.info(result.message || ALREADY_USED_MESSAGE);
        return;
      }

      setError(safeErrorMessage(result.message));
    } catch (err) {
      console.error("[TV Lebara] Falha ao gerar o teste grátis.", err);
      setError(safeErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  }

  async function resetTrialForDev() {
    setError(null);
    try {
      await resetTrialRequest();
      setCredentials(null);
      setJustGenerated(false);
      setStatus(optimisticAllowed());
      toast.success("Teste grátis resetado. Você já pode gerar novamente.");
    } catch (err) {
      console.error("[TV Lebara][dev] Falha ao resetar o teste grátis.", err);
      setError(safeErrorMessage(err));
    }
  }

  const trialCredentials = credentials ?? status?.trial ?? null;
  const alreadyUsed = status?.reason === "already_used";
  const needsProfile = status?.reason === "cpf_missing";
  const inProgress = status?.reason === "in_progress";
  const canGenerate = status ? status.allowed : true;

  if (trialCredentials) {
    return (
      <div className="mb-6 space-y-4">
        <HorizonSignupForm credentials={trialCredentials} />
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-primary">
                {justGenerated ? "Teste grátis liberado!" : "Seu teste grátis já foi gerado"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {justGenerated
                  ? `Aproveite ${HORIZON_TRIAL_HOURS} horas de acesso. Para continuar depois, assine um plano oficial.`
                  : ALREADY_USED_MESSAGE}
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link to="/assinar">
                Assinar Plano Oficial <ArrowRight />
              </Link>
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <Panel className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            {alreadyUsed ? <ShieldCheck className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Teste grátis</p>
            <h2 className="font-display text-xl font-bold">
              {alreadyUsed
                ? "Teste grátis já utilizado"
                : `Experimente a TV Lebara por ${HORIZON_TRIAL_HOURS} horas`}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {needsProfile
                ? "Complete seu perfil com um CPF válido para liberar o teste."
                : alreadyUsed
                  ? ALREADY_USED_MESSAGE
                  : inProgress
                    ? "Seu teste está sendo gerado. Aguarde alguns instantes e atualize a página."
                    : `Gere suas credenciais de teste na hora. A regra é estrita: apenas 1 teste por perfil e por CPF.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {needsProfile && (
            <Button asChild className="rounded-full">
              <Link to="/perfil">
                Completar perfil <ArrowRight />
              </Link>
            </Button>
          )}
          {alreadyUsed && (
            <Button asChild className="rounded-full">
              <Link to="/assinar">
                Assinar Plano Oficial <ArrowRight />
              </Link>
            </Button>
          )}
          {!needsProfile && !alreadyUsed && !inProgress && canGenerate && (
            <Button
              type="button"
              className="rounded-full"
              disabled={requesting || loadingStatus}
              onClick={() => void generateTrial()}
            >
              {requesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                </>
              ) : (
                <>
                  {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{" "}
                  {GENERATE_LABEL}
                </>
              )}
            </Button>
          )}
          {import.meta.env.DEV && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-muted-foreground"
              onClick={() => void resetTrialForDev()}
            >
              Resetar teste (dev)
            </Button>
          )}
          {inProgress && (
            <Button type="button" variant="outline" className="rounded-full" disabled>
              <Loader2 className="h-4 w-4 animate-spin" /> Em andamento
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 rounded-full"
            disabled={requesting}
            onClick={() => void generateTrial()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Perfil:{" "}
        <span className="font-medium text-foreground">
          {account.profile?.cpf ?? "CPF não informado"}
        </span>
        {" · "}O teste expira automaticamente após {HORIZON_TRIAL_HOURS} horas.
      </p>
    </Panel>
  );
}
