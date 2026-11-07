# Integração Horizon (IPTV)

O fluxo do site foi reorganizado para separar **cadastro**, **teste grátis** e **assinatura oficial**:

1. **Cadastro no site** (`/teste-gratis` ou `/auth`) — cria a conta no Supabase Auth e salva
   nome, WhatsApp e CPF no perfil. Depois do cadastro/login, o cliente vai para `/minha-conta`.
2. **Teste grátis de 4 horas** (`/minha-conta`) — o card do teste só aparece na área autenticada.
   A geração é permitida **1 vez por perfil e 1 vez por CPF**.
3. **Assinatura oficial** (`/assinar`) — mostra **dois cards** (Premium e Premium Plus) com o preço
   base. O período (mensal, trimestral, semestral ou anual) e a forma de pagamento (Pix ou cartão)
   são escolhidos no **checkout**. **Nenhuma credencial é criada antes do pagamento.**
4. **Liberação automática** — quando o gateway confirma o pagamento, o webhook cria a conta na
   Horizon com o `plan_id` exato do plano contratado e grava as credenciais em
   `horizon_accounts`. O cliente vê usuário/senha em `/minha-conta`.

## Status do teste da API Devs

Teste executado contra o painel real:

- Endpoint: `POST https://tvlebara.hoffice.sbs/api/v1/devs/criar-assinatura`
- Token Bearer: válido (o painel autentica a requisição)
- `GET` no endpoint → `405 Method Not Allowed` (`Allow: POST`) — rota existe
- Sem token → `401 {"success":false,"message":"Token Bearer não informado."}`
- Token inválido → `401 {"success":false,"message":"Token inválido ou não autorizado."}`
- Token válido + corpo vazio → `422` pedindo `nome`
- Token válido + `nome`/`email` válidos + `plano` string → `422`:
  `{"success":false,"message":"Nenhum servidor XuiOne válido configurado para esta integração."}`

**Conclusão:** URL e token estão corretos e a API responde. A criação de assinatura está bloqueada
por uma configuração pendente **no painel Horizon**: é preciso vincular um servidor **XuiOne válido**
à integração da API Devs. Depois disso, cadastre os IDs exatos dos planos em **`/admin/planos`**
(ou nas variáveis `HORIZON_*_PLAN` como fallback) para que a conta seja criada no plano correto.

## Variáveis de ambiente

Defina no servidor (nunca no cliente):

| Variável                    | Obrigatória | Descrição                                                                         |
| --------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `HORIZON_API_URL`           | sim         | URL completa do endpoint de cadastro da Horizon.                                  |
| `HORIZON_API_TOKEN`         | sim         | Token enviado como `Authorization: Bearer <token>`.                               |
| `HORIZON_TRIAL_PLAN`        | fallback    | ID do plano de teste de 4 horas. Usado só quando não há mapeamento no painel.     |
| `HORIZON_PLAN_PREMIUM`      | fallback    | ID do plano Premium. Usado só quando não há mapeamento no painel.                 |
| `HORIZON_PLAN_PREMIUM_PLUS` | fallback    | ID do plano Premium Plus. Usado só quando não há mapeamento no painel.            |
| `HORIZON_PLAYER_URL`        | não         | URL/servidor exibido ao cliente quando a Horizon não devolve o endereço.          |
| `HORIZON_SERVER_URL`        | não         | Alternativa a `HORIZON_PLAYER_URL`.                                               |
| `HORIZON_M3U_PATH`          | não         | Caminho para montar o link M3U quando a Horizon não devolve um (ex.: `/get.php`). |

> Os IDs precisam ser exatamente os cadastrados no Painel Horizon. O site envia o valor em
> `plano` / `plano_id`; o nome amigável vai apenas em `nome_plano` / `plan_name`.

## Mapeamento de planos no painel

Acesse **`/admin/planos`** no painel administrativo (menu **Planos Horizon**). A tela lista todos os
planos do site:

- Premium Mensal, Premium Trimestral, Premium Semestral e Premium Anual;
- Premium Plus Mensal, Premium Plus Trimestral, Premium Plus Semestral e Premium Plus Anual;
- Teste grátis de 4 horas.

Para cada linha, informe o **ID exato** do plano no painel Horizon e clique em **Salvar**. O
mapeamento fica na tabela `public.horizon_plan_mappings` e pode ser alterado a qualquer momento,
direto pelo painel ou pelo banco, sem deploy.

**Precedência usada na criação da conta:**

1. linha da tabela `horizon_plan_mappings` para o **plano + período** comprado;
2. variável de ambiente do plano (`HORIZON_*_PLAN`) como fallback;
3. se nenhum dos dois existir, a criação falha com uma mensagem clara.

O botão de remover apaga a linha e faz o sistema voltar ao fallback por variável de ambiente. O
mapeamento é consultado **somente depois do pagamento aprovado**, no momento de criar o login e a
senha na Horizon.

## Como a chamada é feita

O único ponto que fala com a Horizon é `src/lib/horizon.server.ts`:

```http
POST {HORIZON_API_URL}
Authorization: Bearer {HORIZON_API_TOKEN}
Content-Type: application/json
Accept: application/json
```

Exemplo de corpo para um plano oficial (campos exigidos pela API Devs em **português**):

```json
{
  "nome": "Nome do cliente",
  "email": "cliente@exemplo.com",
  "plano": "ID_DO_PLANO_PREMIUM_NO_PAINEL",
  "telefone": "11999999999",
  "whatsapp": "11999999999",
  "cpf": "12345678909",
  "documento": "12345678909",
  "plano_id": "ID_DO_PLANO_PREMIUM_NO_PAINEL",
  "nome_plano": "Premium · 1 tela",
  "conexoes": 1,
  "max_conexoes": 1,
  "dispositivo": "tv_box",
  "servidor": "auto",
  "servidor_id": "auto",
  "usuario": "cliente0909",
  "senha": "senhaGerada",
  "senha_confirmation": "senhaGerada",
  "teste": false,
  "duracao_horas": null,
  "referencia_externa": "uuid-do-usuario",
  "origem": "tvlebara-site"
}
```

O payload também mantém aliases em inglês (`name`, `email`, `plan`, `plan_id`, `username`,
`password`, ...) para compatibilidade com outras versões do painel. A API valida pelo menos
`nome` (string), `email` (e-mail válido) e `plano` (string).

No teste grátis, `teste`/`trial` vão como `true`, `duracao_horas` como `4` e o plano usa o
mapeamento da linha **Teste grátis 4 horas** (ou `HORIZON_TRIAL_PLAN` como fallback).

> A Horizon pode ignorar campos que não conhece. Se o contrato do seu painel usar outros nomes,
> ajuste `buildHorizonPayload` em `src/lib/horizon.server.ts`. Os valores de dispositivo e servidor
> ficam em `src/lib/horizon.ts` (`horizonDevices` / `horizonServers`).

## Normalização da resposta

A resposta da Horizon é lida de forma tolerante: o adaptador procura usuário/senha, servidor, link
M3U, validade, plano e número de conexões em envelopes comuns (`data`, `credentials`, `account`,
`client`, `user`, listas etc.). Se o painel não devolver usuário/senha, o site usa o usuário e a
senha gerados antes da chamada, para que o cliente nunca fique sem credenciais.

Arquivos envolvidos:

- `src/lib/horizon.server.ts` — HTTP, payload, resolução do `plan_id` e normalização.
- `src/lib/horizon-plans.ts` — catálogo compartilhado dos planos/períodos e helpers de chave.
- `src/lib/horizon-plans.functions.ts` — server functions de leitura/salvamento/remoção do
  mapeamento em `/admin/planos`.
- `src/lib/horizon.functions.ts` — server functions autenticadas do `/minha-conta`
  (teste, status oficial e retry).
- `src/lib/horizon-trials.server.ts` — persistência e trava do teste.
- `src/lib/horizon-accounts.server.ts` — criação idempotente da conta oficial e persistência.
- `src/components/site/SiteSignupForm.tsx` — cadastro/login no site (Supabase Auth).
- `src/components/site/AccountTrialCard.tsx` — card do teste em `/minha-conta`.
- `src/components/site/OfficialAccountCard.tsx` — credenciais/status oficial em `/minha-conta`.
- `src/components/site/CredentialsCard.tsx` — exibição/cópia das credenciais.
- `src/lib/mercadopago.server.ts` — ponto do webhook que dispara a criação após o pagamento.

## Banco de dados (obrigatório)

Aplique as duas migrations no Supabase:

```sql
-- supabase/migrations/20261105120000_horizon_trials.sql
-- supabase/migrations/20261105130000_horizon_accounts.sql
-- supabase/migrations/20261105140000_horizon_plan_mappings.sql
```

Opções para aplicar:

1. **Supabase CLI** (recomendado):

   ```bash
   supabase db push
   ```

2. **Dashboard do Supabase** → SQL Editor → cole o conteúdo de cada migration e execute.

### `horizon_trials`

- tabela `public.horizon_trials`;
- índice único `horizon_trials_cpf_key` em `cpf` — **1 teste por CPF em todo o site**;
- índice único `horizon_trials_user_id_key` em `user_id` (quando não nulo) — **1 teste por perfil**;
- RLS de leitura apenas para o próprio assinante.

### `horizon_accounts`

- tabela `public.horizon_accounts`;
- índice único `horizon_accounts_user_id_key` em `user_id` — **1 conta oficial por assinante**;
- campos de plano (`plan_tier`, `billing_period`, `plan_id`), credenciais e status
  (`pending`, `active`, `failed`);
- RLS de leitura apenas para o próprio assinante. As escritas usam a service role no servidor.

### `horizon_plan_mappings`

- tabela `public.horizon_plan_mappings`;
- chave única em `(plan_tier, billing_period)` — uma linha por plano do site;
- coluna `horizon_plan_id` com o ID exato do painel Horizon;
- RLS de leitura para a equipe administrativa. As escritas usam a service role depois da checagem
  de cargo em `/admin/planos`.

Sem as migrations, o teste e/ou as credenciais oficiais não conseguem ser registrados.

## Regra do teste grátis

- A geração acontece somente em `/minha-conta`, com o assinante autenticado.
- Exige perfil com nome, CPF válido e WhatsApp.
- Se o CPF ou o perfil já tiverem um teste concluído, a geração é bloqueada e o site mostra o
  botão **Assinar plano oficial**.
- Tentativas com falha são removidas; tentativas pendentes com mais de 15 minutos são limpas
  automaticamente para não bloquear o CPF para sempre.

## Fluxo de pagamento e criação automática

1. `/assinar` mostra os dois planos oficiais e leva para `/checkout`.
2. No checkout, o cliente escolhe o período e paga com Pix ou cartão.
3. Quando o pagamento é aprovado, `syncPayment` (chamado pelo webhook e pelo polling do checkout):
   - ativa a assinatura no Supabase;
   - chama `ensureHorizonAccountForUser`.
4. `ensureHorizonAccountForUser`:
   - é idempotente (índice único por `user_id` + checagem de status);
   - resolve o `plan_id` pelo mapeamento `plano + período` em `horizon_plan_mappings` (com
     fallback para a variável de ambiente do tier);
   - cria a conta na Horizon e salva usuário/senha em `horizon_accounts`;
   - em caso de falha, grava o motivo e permite novo retry automático/manual.
5. `/minha-conta` mostra:
   - **pending**: “Preparando suas credenciais” (com polling);
   - **active**: credenciais oficiais;
   - **failed**: mensagem e botão **Liberar credenciais** (só funciona com assinatura ativa).

## Checklist para liberar a criação automática

1. No painel Horizon, configurar um **servidor XuiOne válido** para a integração da API Devs.
2. Aplicar as migrations `20261105120000_horizon_trials.sql`,
   `20261105130000_horizon_accounts.sql` e `20261105140000_horizon_plan_mappings.sql`.
3. Em **`/admin/planos`**, salvar o ID exato de cada plano (Premium e Premium Plus em todos os
   períodos) e do teste grátis.
4. Opcionalmente, manter as variáveis `HORIZON_TRIAL_PLAN`, `HORIZON_PLAN_PREMIUM` e
   `HORIZON_PLAN_PREMIUM_PLUS` como fallback.
5. Configurar `MERCADO_PAGO_*` para o checkout e o webhook reais.
6. Executar uma assinatura de teste e confirmar que a conta é criada no plano correto após o
   pagamento aprovado.

## Segurança

- `HORIZON_API_TOKEN` e a service role do Supabase só são usados no servidor (`*.server.ts` e rotas
  de API). Nunca exponha esses valores em variáveis `VITE_*`.
- O cadastro público não cria mais conta na Horizon. O endpoint antigo
  `/api/horizon/register` foi removido.
- O CPF é normalizado para apenas dígitos antes de ser salvo/consultado.
- A criação da conta oficial só ocorre quando existe pagamento aprovado; o retry manual também
  exige assinatura ativa.
