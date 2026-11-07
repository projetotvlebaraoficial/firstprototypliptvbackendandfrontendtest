import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Hoje o site só usa recursos estritamente necessários. As categorias opcionais já ficam
// registradas para que nenhuma ferramenta futura seja ativada sem escolha do usuário.
export const COOKIE_POLICY_VERSION = "1.0";
const KEY = "tvlebara_cookie_consent";
const EVT = "tvlebara:cookie-prefs";

type Prefs = { preferences: boolean; analytics: boolean; marketing: boolean };
type Stored = Prefs & { version: string; decidedAt: string };

export function openCookiePreferences() {
  window.dispatchEvent(new Event(EVT));
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [custom, setCustom] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ preferences: false, analytics: false, marketing: false });

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw) as Stored;
        if (s.version === COOKIE_POLICY_VERSION) setPrefs(s); else setShow(true);
      } catch { setShow(true); }
    } else setShow(true);
    const open = () => { setShow(true); setCustom(true); };
    window.addEventListener(EVT, open);
    return () => window.removeEventListener(EVT, open);
  }, []);

  const save = (p: Prefs) => {
    const s: Stored = { ...p, version: COOKIE_POLICY_VERSION, decidedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(s));
    setPrefs(p); setShow(false); setCustom(false);
  };

  if (!show) return null;
  const rows: { k: keyof Prefs | "necessary"; t: string; d: string }[] = [
    { k: "necessary", t: "Estritamente necessários", d: "Mantêm o site funcionando, a segurança e o login. Não podem ser desligados." },
    { k: "preferences", t: "Preferências", d: "Guardam escolhas de interface. No momento, não utilizamos." },
    { k: "analytics", t: "Analíticos e de desempenho", d: "Ajudam a entender o uso do site. No momento, não utilizamos." },
    { k: "marketing", t: "Publicidade e marketing", d: "Usados para anúncios. No momento, não utilizamos." },
  ];

  return (
    <div role="dialog" aria-live="polite" aria-label="Preferências de cookies" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl animate-rise rounded-2xl border bg-card p-6 shadow-lift">
      <h2 className="text-lg font-bold">Sua privacidade importa</h2>
      <p className="mt-2 text-muted-foreground">
        Usamos apenas o essencial para o site funcionar. Você decide sobre o restante. Saiba mais na{" "}
        <Link to="/cookies" className="text-primary underline">Política de Cookies</Link>.
      </p>
      {custom && (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.k} className="flex items-start justify-between gap-4 rounded-lg bg-muted p-3">
              <div><p className="font-semibold">{r.t}</p><p className="text-sm text-muted-foreground">{r.d}</p></div>
              <Switch
                aria-label={r.t}
                checked={r.k === "necessary" ? true : prefs[r.k]}
                disabled={r.k === "necessary"}
                onCheckedChange={(v) => r.k !== "necessary" && setPrefs({ ...prefs, [r.k]: v })}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="ink" onClick={() => save({ preferences: true, analytics: true, marketing: true })}>Aceitar todos</Button>
        <Button variant="ink" onClick={() => save({ preferences: false, analytics: false, marketing: false })}>Rejeitar não essenciais</Button>
        {custom
          ? <Button variant="outline" onClick={() => save(prefs)}>Salvar escolhas</Button>
          : <Button variant="outline" onClick={() => setCustom(true)}>Personalizar preferências</Button>}
      </div>
    </div>
  );
}
