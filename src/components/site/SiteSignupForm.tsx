import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Loader2, LockKeyhole, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { syncProfileFromMetadata } from "@/lib/account";
import { isValidCpf, maskCpf, maskPhone } from "@/lib/br";

type Mode = "cadastro" | "entrar";

export function SiteSignupForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("cadastro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/minha-conta", replace: true });
    });
  }, [navigate]);

  function goToAccount() {
    navigate({ to: "/minha-conta", replace: true });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(null);

    const emailValue = email.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const cpfDigits = cpf.replace(/\D/g, "");

    if (!/^\S+@\S+\.\S+$/.test(emailValue)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (mode === "cadastro") {
      if (name.trim().length < 3) {
        setError("Informe seu nome completo.");
        return;
      }
      if (phoneDigits.length < 10) {
        setError("Informe um WhatsApp válido.");
        return;
      }
      if (!isValidCpf(cpfDigits)) {
        setError("Informe um CPF válido.");
        return;
      }
      if (password.length < 8) {
        setError("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      if (password !== confirm) {
        setError("As senhas não coincidem.");
        return;
      }
      if (!accept) {
        setError("Aceite os Termos de Uso e a Política de Privacidade.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "cadastro") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: emailValue,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/minha-conta`,
            data: {
              full_name: name.trim(),
              whatsapp: phoneDigits,
              cpf: cpfDigits,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          if (data.user) await syncProfileFromMetadata(data.user).catch(() => undefined);
          toast.success("Conta criada! Bem-vindo à TV Lebara.");
          goToAccount();
          return;
        }

        setSent(
          `Conta criada! Enviamos um link de confirmação para ${emailValue}. Abra seu e-mail para ativar a conta e entrar no painel do assinante.`,
        );
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password,
      });
      if (signInError) {
        throw new Error(
          signInError.message.includes("confirm")
            ? "Confirme seu e-mail antes de entrar."
            : "E-mail ou senha incorretos.",
        );
      }
      if (data.user) await syncProfileFromMetadata(data.user).catch(() => undefined);
      toast.success("Bem-vindo de volta!");
      goToAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border bg-card p-6 shadow-soft md:p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">Confirme seu e-mail</h2>
            <p className="mt-2 text-sm text-muted-foreground">{sent}</p>
          </div>
        </div>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/auth" search={{ modo: "entrar", redirect: "/minha-conta" }}>
            Ir para o login <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft md:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          {mode === "cadastro" ? (
            <UserPlus className="h-5 w-5" />
          ) : (
            <LockKeyhole className="h-5 w-5" />
          )}
        </span>
        <div>
          <h2 className="font-display text-xl font-bold">
            {mode === "cadastro" ? "Crie sua conta na TV Lebara" : "Entre na sua conta"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "cadastro"
              ? "O cadastro é gratuito. Depois de entrar, você gera o teste de 4 horas ou assina um plano oficial no painel do assinante."
              : "Acesse o painel do assinante para gerar seu teste ou acompanhar sua assinatura."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
        {(["cadastro", "entrar"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setError(null);
            }}
            className={`rounded-full py-2 ${mode === option ? "bg-card shadow-soft" : "text-muted-foreground"}`}
          >
            {option === "cadastro" ? "Criar conta" : "Entrar"}
          </button>
        ))}
      </div>

      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-5">
        {mode === "cadastro" && (
          <div>
            <Label htmlFor="signup-name">Nome completo</Label>
            <Input
              id="signup-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={120}
              required
              className="mt-1.5 h-11"
            />
          </div>
        )}

        <div>
          <Label htmlFor="signup-email">E-mail</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            maxLength={160}
            required
            className="mt-1.5 h-11"
          />
        </div>

        {mode === "cadastro" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="signup-phone">WhatsApp</Label>
              <Input
                id="signup-phone"
                inputMode="numeric"
                value={phone}
                onChange={(event) => setPhone(maskPhone(event.target.value))}
                placeholder="(11) 90000-0000"
                autoComplete="tel"
                required
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="signup-cpf">CPF</Label>
              <Input
                id="signup-cpf"
                inputMode="numeric"
                value={cpf}
                onChange={(event) => setCpf(maskCpf(event.target.value))}
                placeholder="000.000.000-00"
                required
                className="mt-1.5 h-11"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="signup-password">Senha</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "cadastro" ? "new-password" : "current-password"}
            minLength={mode === "cadastro" ? 8 : undefined}
            required
            className="mt-1.5 h-11"
          />
        </div>

        {mode === "cadastro" && (
          <>
            <div>
              <Label htmlFor="signup-confirm">Confirmar senha</Label>
              <Input
                id="signup-confirm"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
                className="mt-1.5 h-11"
              />
            </div>
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={accept}
                onCheckedChange={(value) => setAccept(value === true)}
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

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="flex items-start gap-2 font-medium text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          </div>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Aguarde...
            </>
          ) : mode === "cadastro" ? (
            <>
              Criar minha conta <ArrowRight />
            </>
          ) : (
            <>
              Entrar no painel <ArrowRight />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "cadastro" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              setMode(mode === "cadastro" ? "entrar" : "cadastro");
              setError(null);
            }}
          >
            {mode === "cadastro" ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </form>
    </div>
  );
}
