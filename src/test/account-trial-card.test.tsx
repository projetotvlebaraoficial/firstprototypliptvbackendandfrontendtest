import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  status: vi.fn(),
  request: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({
    data: {
      profile: { cpf: "404.496.648-64", full_name: "Cliente Teste" },
      subscription: null,
    },
  }),
}));

vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: unknown) => fn,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/account", () => ({ accountQuery: {} }));
vi.mock("@/lib/horizon-dev.functions", () => ({ resetAccountTrial: vi.fn() }));

vi.mock("@/lib/horizon.functions", () => ({
  getAccountTrialStatus: mocks.status,
  requestAccountTrial: mocks.request,
}));

vi.mock("@/components/site/AccountShell", () => ({
  Panel: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { AccountTrialCard } from "@/components/site/AccountTrialCard";

const allowed = {
  allowed: true,
  reason: "allowed" as const,
  message: "Você pode gerar agora seu teste grátis de 4 horas.",
  trial: null,
  completedAt: null,
};

const alreadyUsed = {
  allowed: false,
  reason: "already_used" as const,
  message: "Você já utilizou o teste grátis de 4 horas.",
  trial: null,
  completedAt: "2026-11-05T12:00:00.000Z",
};

describe("AccountTrialCard", () => {
  beforeEach(() => {
    mocks.status.mockReset();
    mocks.request.mockReset();
  });

  it("mostra o botão de gerar teste assim que o status permite", async () => {
    mocks.status.mockResolvedValue(allowed);

    render(<AccountTrialCard />);

    expect(
      await screen.findByRole("button", { name: /Gerar Teste Grátis de 4 Horas/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Serviço temporariamente indisponível/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Não foi possível consultar a situação do seu teste grátis/i),
    ).not.toBeInTheDocument();
  });

  it("mantém o botão visível quando a consulta de status falha", async () => {
    mocks.status.mockRejectedValue(new Error("Missing Supabase environment variable"));

    render(<AccountTrialCard />);

    expect(
      await screen.findByRole("button", { name: /Gerar Teste Grátis de 4 Horas/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Serviço temporariamente indisponível/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Não foi possível consultar a situação do seu teste grátis/i),
    ).not.toBeInTheDocument();
  });

  it("bloqueia a geração e direciona para o plano oficial quando o teste já foi usado", async () => {
    mocks.status.mockResolvedValue(alreadyUsed);

    render(<AccountTrialCard />);

    expect(await screen.findByRole("link", { name: /Assinar Plano Oficial/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Gerar Teste Grátis de 4 Horas/i }),
    ).not.toBeInTheDocument();
  });

  it("exibe usuário, senha e URL no template limpo após gerar o teste", async () => {
    mocks.status.mockResolvedValue(allowed);
    mocks.request.mockResolvedValue({
      ok: true,
      message: "Teste grátis de 4 horas gerado com sucesso.",
      credentials: {
        username: "teste4864",
        password: "AbC123xYz9",
        serverUrl: "http://servidor.tvlebara.test",
        m3uUrl: null,
        expiresAt: "2026-11-05T16:00:00.000Z",
        planName: "Teste grátis 4h",
        connections: 1,
        isTrial: true,
      },
    });

    render(<AccountTrialCard />);

    const button = await screen.findByRole("button", {
      name: /Gerar Teste Grátis de 4 Horas/i,
    });
    fireEvent.click(button);

    expect(await screen.findByText("teste4864")).toBeInTheDocument();
    expect(screen.getByText("AbC123xYz9")).toBeInTheDocument();
    expect(screen.getByText("http://p2cat.shop")).toBeInTheDocument();
    expect(screen.getByText("Usuário")).toBeInTheDocument();
    expect(screen.getByText("Senha")).toBeInTheDocument();
    expect(screen.getByText("URL Xtream para TVs Smarts (Samsung, Roku ou LG):")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar Usuário/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar Senha/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar URL Xtream para TVs Smarts \(Samsung, Roku ou LG\):/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Baixar aplicativo Android/i })).toBeInTheDocument();
  });
});
