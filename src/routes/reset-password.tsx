import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — TV Lebara" },
      { name: "description", content: "Defina uma nova senha para sua conta TV Lebara." },
      { property: "og:title", content: "Criar nova senha — TV Lebara" },
      { property: "og:description", content: "Defina uma nova senha para sua conta TV Lebara." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password.length < 8) return void toast.error("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== String(f.get("confirm"))) return void toast.error("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return void toast.error("Link inválido ou expirado. Peça um novo link.");
    toast.success("Senha atualizada!");
    navigate({ to: "/minha-conta" });
  }
  return (
    <section className="px-3 pb-16 pt-28 md:px-5">
      <div className="mx-auto max-w-md rounded-[2rem] border bg-card p-8 shadow-lift">
        <h1 className="font-display text-3xl font-extrabold">Criar nova senha</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><Label htmlFor="password">Nova senha</Label><Input id="password" name="password" type="password" required autoComplete="new-password" className="mt-1.5 h-11" /></div>
          <div><Label htmlFor="confirm">Confirmar nova senha</Label><Input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="mt-1.5 h-11" /></div>
          <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">{loading ? "Salvando…" : "Salvar nova senha"}</Button>
        </form>
      </div>
    </section>
  );
}
