import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { syncProfileFromMetadata } from "@/lib/account";
import { isValidCpf, maskCpf, maskPhone } from "@/lib/br";
import { company } from "@/lib/site";
import studio from "@/assets/studio.jpg";

type Search = {
  redirect?: string | undefined;
  modo?: "entrar" | "cadastro" | "recuperar" | undefined;
};

function safePath(r?: string) {
  if (!r) return "/minha-conta";
  try {
    const u = new URL(r, "http://x");
    return u.pathname.startsWith("/") && !u.pathname.startsWith("//")
      ? u.pathname + u.search
      : "/minha-conta";
  } catch {
    return "/minha-conta";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
    modo: s["modo"] === "cadastro" || s["modo"] === "recuperar" ? s["modo"] : "entrar",
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — TV Lebara" },
      {
        name: "description",
        content: "Acesse sua conta TV Lebara ou crie seu cadastro para assinar.",
      },
      { property: "og:title", content: "Entrar ou criar conta — TV Lebara" },
      {
        property: "og:description",
        content: "Acesse sua conta TV Lebara ou crie seu cadastro para assinar.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect, modo = "entrar" } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [accept, setAccept] = useState(false);
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const target = safePath(redirect);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const saved = sessionStorage.getItem("pos-login");
        sessionStorage.removeItem("pos-login");
        navigate({ to: safePath(saved ?? target) as "/minha-conta", replace: true });
      }
    });
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN") {
        const saved = sessionStorage.getItem("pos-login");
        sessionStorage.removeItem("pos-login");
        navigate({ to: safePath(saved ?? target) as "/minha-conta", replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);
  const setModo = (m: Search["modo"]) => {
    setSent(null);
    navigate({ to: "/auth", search: { redirect, modo: m }, replace: true });
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    setLoading(true);
    try {
      if (modo === "entrar") {
        const lockMsg = (s: number) =>
          `Muitas tentativas incorretas. Tente novamente em ${Math.ceil(s / 60)} minuto(s).`;
        const { data: wait } = await supabase.rpc("login_lock_status", { _email: email });
        if (wait && wait > 0) throw new Error(lockMsg(wait));
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid")) {
            const { data: locked } = await supabase.rpc("login_register_fail", { _email: email });
            throw new Error(locked && locked > 0 ? lockMsg(locked) : "E-mail ou senha incorretos.");
          }
          throw new Error(
            error.message.includes("confirm")
              ? "Confirme seu e-mail antes de entrar."
              : error.message,
          );
        }
        void supabase.rpc("login_clear");
        navigate({ to: target as "/minha-conta" });
      } else if (modo === "cadastro") {
        if (!accept) throw new Error("Aceite os Termos de Uso e a Política de Privacidade.");
        if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
        if (password !== String(f.get("confirm"))) throw new Error("As senhas não coincidem.");
        const phoneDigits = phone.replace(/\D/g, "");
        const cpfDigits = cpf.replace(/\D/g, "");
        if (phoneDigits.length < 10) throw new Error("Informe um WhatsApp válido.");
        if (!isValidCpf(cpfDigits)) throw new Error("Informe um CPF válido.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + target,
            data: {
              full_name: String(f.get("name") || ""),
              whatsapp: phoneDigits,
              cpf: cpfDigits,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          if (data.user) await syncProfileFromMetadata(data.user).catch(() => undefined);
          navigate({ to: target as "/minha-conta" });
          return;
        }
        setSent(
          `Enviamos um link de confirmação para ${email}. Abra seu e-mail para ativar a conta.`,
        );
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(
          `Se houver uma conta com ${email}, você receberá um link para criar uma nova senha.`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  }

  const titles = {
    entrar: "Bem-vindo de volta",
    cadastro: "Crie sua conta",
    recuperar: "Recuperar senha",
  };

  return (
    <section className="px-3 pb-16 pt-24 md:px-5 md:pt-28">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border bg-card shadow-lift lg:grid-cols-2">
        <div className="relative hidden min-h-[36rem] bg-ink text-ink-foreground lg:block">
          <img
            src={studio}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-10">
            <p className="text-sm font-semibold text-primary-glow">{company.name}</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">
              Axé, cultura e memória em um só lugar.
            </h2>
            <p className="mt-3 text-ink-foreground/75">
              Transmissões ao vivo, entrevistas, palestras e podcasts para quem vive as tradições de
              matriz africana.
            </p>
          </div>
        </div>
        <div className="p-7 md:p-12">
          <h1 className="font-display text-3xl font-extrabold">{titles[modo]}</h1>
          {modo !== "recuperar" && (
            <div className="mt-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
              {(["entrar", "cadastro"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModo(m)}
                  className={`rounded-full py-2 ${modo === m ? "bg-card shadow-soft" : "text-muted-foreground"}`}
                >
                  {m === "entrar" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>
          )}
          {sent ? (
            <div className="mt-8 rounded-2xl bg-primary/10 p-5 text-sm">{sent}</div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {modo === "cadastro" && (
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    className="mt-1.5 h-11"
                  />
                </div>
              )}
              {modo === "cadastro" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input
                      id="phone"
                      name="phone"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="(11) 90000-0000"
                      autoComplete="tel"
                      required
                      className="mt-1.5 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      inputMode="numeric"
                      value={cpf}
                      onChange={(e) => setCpf(maskCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      required
                      className="mt-1.5 h-11"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1.5 h-11"
                />
              </div>
              {modo !== "recuperar" && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    {modo === "entrar" && (
                      <button
                        type="button"
                        onClick={() => setModo("recuperar")}
                        className="text-sm text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={modo === "cadastro" ? 8 : undefined}
                    autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                    className="mt-1.5 h-11"
                  />
                </div>
              )}
              {modo === "cadastro" && (
                <>
                  <div>
                    <Label htmlFor="confirm">Confirmar senha</Label>
                    <Input
                      id="confirm"
                      name="confirm"
                      type="password"
                      required
                      autoComplete="new-password"
                      className="mt-1.5 h-11"
                    />
                  </div>
                  <label className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Checkbox
                      checked={accept}
                      onCheckedChange={(v) => setAccept(v === true)}
                      className="mt-0.5"
                    />
                    <span>
                      Li e aceito os{" "}
                      <Link to="/termos" className="text-primary underline">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link to="/privacidade" className="text-primary underline">
                        Política de Privacidade
                      </Link>
                      .
                    </span>
                  </label>
                </>
              )}
              <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">
                {loading
                  ? "Aguarde…"
                  : modo === "entrar"
                    ? "Entrar"
                    : modo === "cadastro"
                      ? "Criar conta"
                      : "Enviar link"}
              </Button>
            </form>
          )}
          {modo === "recuperar" && (
            <button
              type="button"
              onClick={() => setModo("entrar")}
              className="mt-6 text-sm text-primary hover:underline"
            >
              Voltar para o login
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
