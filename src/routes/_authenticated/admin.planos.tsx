import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteHorizonPlanMapping,
  listHorizonPlanMappings,
  saveHorizonPlanMapping,
} from "@/lib/horizon-plans.functions";
import {
  horizonPlanCatalog,
  type HorizonPlanCatalogItem,
  type HorizonPlanTier,
} from "@/lib/horizon-plans";
import { friendlyErrorMessage } from "@/lib/user-errors";
import type { Database } from "@/integrations/supabase/types";

type MappingRow = Database["public"]["Tables"]["horizon_plan_mappings"]["Row"];

const mappingsQuery = queryOptions({
  queryKey: ["horizon-plan-mappings"],
  queryFn: () => listHorizonPlanMappings(),
});

export const Route = createFileRoute("/_authenticated/admin/planos")({
  head: () => ({
    meta: [
      { title: "Planos TV Lebara — Painel administrativo" },
      {
        name: "description",
        content: "Mapeamento dos planos do site para a conta oficial TV Lebara.",
      },
      { property: "og:title", content: "Planos TV Lebara — Painel administrativo" },
      {
        property: "og:description",
        content: "Mapeamento dos planos do site para a conta oficial TV Lebara.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(mappingsQuery);
  },
  component: PlanMapping,
});

const groups = ["Premium", "Premium Plus", "Teste grátis"] as const;

function envReadyForTier(
  tier: HorizonPlanTier,
  env: { trial: boolean; premium: boolean; premium_plus: boolean },
) {
  if (tier === "trial") return env.trial;
  if (tier === "premium_plus") return env.premium_plus;
  return env.premium;
}

function PlanMapping() {
  const { data, refetch, isFetching } = useSuspenseQuery(mappingsQuery);
  const mappings = new Map(
    data.mappings.map((row) => [`${row.plan_tier}:${row.billing_period}`, row]),
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Planos TV Lebara</h1>
      <p className="mt-1 max-w-3xl text-muted-foreground">
        Vincule cada plano do site ao ID exato cadastrado no painel oficial TV Lebara. A integração
        consulta este mapeamento no momento da criação da conta, após o pagamento aprovado.
        Alterações aqui passam a valer na próxima assinatura, sem precisar alterar o código.
      </p>

      {data.unavailable && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-bold">Não foi possível carregar os planos agora.</p>
            <p className="mt-1 text-muted-foreground">
              {data.message ??
                "Serviço temporariamente indisponível. Tente novamente em instantes."}
            </p>
          </div>
        </div>
      )}

      {!data.tableReady && !data.unavailable && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-bold">O cadastro de planos ainda não está disponível.</p>
            <p className="mt-1 text-muted-foreground">
              Aplique a migration pendente no Supabase para liberar o cadastro dos IDs.
            </p>
          </div>
        </div>
      )}

      {!data.unavailable && (
        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Mapeamento por plano</h2>
              <p className="text-sm text-muted-foreground">
                O ID do painel tem prioridade sobre as variáveis de ambiente.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {groups.map((group) => (
            <div key={group} className="mt-6">
              <h3 className="flex items-center gap-2 font-display text-base font-bold">
                <Link2 className="h-4 w-4 text-primary" />
                {group}
              </h3>
              <div className="mt-2 overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      <th className="p-3">Plano do site</th>
                      <th className="p-3">ID no painel TV Lebara</th>
                      <th className="p-3">Origem do ID</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {horizonPlanCatalog
                      .filter((item) => item.group === group)
                      .map((item) => {
                        const mapping =
                          mappings.get(`${item.planTier}:${item.billingPeriod}`) ?? null;
                        return (
                          <MappingRow
                            key={`${item.planTier}:${item.billingPeriod}`}
                            item={item}
                            mapping={mapping}
                            envReady={envReadyForTier(item.planTier, data.env)}
                          />
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold">Como o ID é escolhido</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            O site identifica o plano comprado (<strong>Premium</strong> ou{" "}
            <strong>Premium Plus</strong>) e o período escolhido no checkout.
          </li>
          <li>
            Depois do pagamento aprovado, o servidor busca o ID na tabela de mapeamento de planos
            usando o plano + período.
          </li>
          <li>
            Se ainda não houver linha cadastrada, usa a variável de ambiente do plano como fallback.
          </li>
          <li>
            O ID encontrado é enviado para a API oficial no campo <code>plano</code> /{" "}
            <code>plano_id</code>, e a TV Lebara gera o login e a senha do cliente.
          </li>
        </ol>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <p>
            <span className="font-semibold">Plano de teste (fallback):</span>{" "}
            {data.env.trial ? "configurado" : "vazio"}
          </p>
          <p>
            <span className="font-semibold">Plano Premium (fallback):</span>{" "}
            {data.env.premium ? "configurado" : "vazio"}
          </p>
          <p>
            <span className="font-semibold">Plano Premium Plus (fallback):</span>{" "}
            {data.env.premium_plus ? "configurado" : "vazio"}
          </p>
        </div>
      </section>
    </div>
  );
}

function MappingRow({
  item,
  mapping,
  envReady,
}: {
  item: HorizonPlanCatalogItem;
  mapping: MappingRow | null;
  envReady: boolean;
}) {
  const qc = useQueryClient();
  const save = useServerFn(saveHorizonPlanMapping);
  const remove = useServerFn(deleteHorizonPlanMapping);
  const [value, setValue] = useState(mapping?.horizon_plan_id ?? "");
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["horizon-plan-mappings"] });

  async function handleSave() {
    const horizonPlanId = value.trim();
    if (!horizonPlanId) {
      toast.error("Informe o ID do plano no painel TV Lebara.");
      return;
    }

    setBusy(true);
    try {
      await save({
        data: {
          planTier: item.planTier,
          billingPeriod: item.billingPeriod,
          horizonPlanId,
        },
      });
      toast.success(`${item.label}: ID salvo.`);
      await refresh();
    } catch (error) {
      toast.error(
        friendlyErrorMessage(error, "Não foi possível salvar o ID. Tente novamente em instantes."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await remove({
        data: { planTier: item.planTier, billingPeriod: item.billingPeriod },
      });
      setValue("");
      toast.success(`${item.label}: mapeamento removido.`);
      await refresh();
    } catch (error) {
      toast.error(
        friendlyErrorMessage(
          error,
          "Não foi possível remover o mapeamento. Tente novamente em instantes.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  const source = mapping ? "Painel" : envReady ? "Variável de ambiente" : "Não configurado";
  const sourceClass = mapping
    ? "bg-primary text-primary-foreground"
    : envReady
      ? "bg-muted text-foreground"
      : "bg-destructive/10 text-destructive";

  return (
    <tr className="align-top">
      <td className="p-3">
        <p className="font-semibold">{item.label}</p>
        <p className="text-xs text-muted-foreground">
          {item.planTier === "trial" ? "Teste único por CPF e por perfil" : item.group}
        </p>
      </td>
      <td className="p-3">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ex.: 12345"
          className="h-10 max-w-xs font-mono"
          aria-label={`ID do plano ${item.label} no painel TV Lebara`}
        />
      </td>
      <td className="p-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${sourceClass}`}>
          {source}
        </span>
        {mapping?.updated_at && (
          <p className="mt-1 text-xs text-muted-foreground">
            Atualizado {new Date(mapping.updated_at).toLocaleString("pt-BR")}
          </p>
        )}
      </td>
      <td className="p-3">
        <div className="flex justify-end gap-2">
          <Button size="sm" className="rounded-full" onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
          {mapping && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={handleRemove}
              disabled={busy}
              aria-label={`Remover mapeamento de ${item.label}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
