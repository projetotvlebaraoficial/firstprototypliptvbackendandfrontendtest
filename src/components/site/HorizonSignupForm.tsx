import { useState } from "react";
import { Check, Clock, Copy, Download, Hash, KeyRound, Link2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HorizonCredentials } from "@/lib/horizon";

const SMART_TV_URL = "http://p2cat.shop";
const ANDROID_APP_URL =
  "https://download947.mediafire.com/eksnmokeoajg5apJDFM7pBO724npX8zEp8SLyiFGJFQzzZVCDeubb4dBvE7Zj5V8HYHNC305ts_k6cPKk5DKv1LLH50BSwkEbI0qgLSnFwCODn4EYttZeXYPqwXD_whNJVquJrb6YcyTMO56XbNIgBt4hhrulzvwfapJo27Y6qbKew/gkwteyiqxled37h/TV+Lebara.apk";
const DOWNLOADER_CODE = "7544203";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("copy_failed");
}

function CredentialField({
  icon: Icon,
  label,
  value,
  secret,
  copyable = true,
}: {
  icon: typeof User;
  label: string;
  value: string;
  secret?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await copyText(value);
      setCopied(true);
      toast.success(`${label} copiado!`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  return (
    <div className="rounded-2xl border bg-muted/40 p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p
          className={cn(
            "min-w-0 break-all font-mono text-lg font-bold",
            secret && "tracking-wider",
          )}
        >
          {value}
        </p>
        {copyable && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full"
            onClick={() => void copy()}
            aria-label={`Copiar ${label}`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Clean credential template used by the subscriber area. It mirrors the panel
 * layout: only Usuário, Senha, plus the Smart TV URL and the Android download.
 */
export function HorizonSignupForm({ credentials }: { credentials: HorizonCredentials }) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-lift">
      <div className="bg-gradient-primary p-6 text-primary-foreground md:p-8">
        <p className="text-sm font-semibold opacity-80">
          {credentials.isTrial ? "Teste grátis liberado" : "Conta oficial liberada"}
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold md:text-3xl">
          Suas credenciais de acesso
        </h2>
        <p className="mt-2 text-sm opacity-85">
          Use os dados abaixo no aplicativo de IPTV. Guarde-os com segurança.
        </p>
      </div>

      <div className="space-y-4 p-6 md:p-8">
        <CredentialField icon={User} label="Usuário" value={credentials.username} />
        <CredentialField icon={KeyRound} label="Senha" value={credentials.password} secret />
        <CredentialField icon={Hash} label="CÓDIGO DOWNLOADER" value={DOWNLOADER_CODE} />

        <CredentialField
          icon={Link2}
          label="URL Xtream para TVs Smarts (Samsung, Roku ou LG):"
          value={SMART_TV_URL}
        />

        <div className="flex flex-wrap gap-2 text-sm">
          {credentials.planName && (
            <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
              {credentials.planName}
            </span>
          )}
          {credentials.expiresAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Válido até {formatDate(credentials.expiresAt)}
            </span>
          )}
        </div>

        <Button asChild className="w-full rounded-full" variant="outline">
          <a href={ANDROID_APP_URL} target="_blank" rel="noopener noreferrer" download>
            <Download className="mr-2 h-4 w-4" />
            Baixar aplicativo Android
          </a>
        </Button>

        <p className="text-xs text-muted-foreground">
          No aplicativo, escolha “Xtream Codes” e informe o usuário e a senha acima. Em Smart TVs
          (Samsung, Roku ou LG), utilize a URL Xtream indicada.
        </p>
      </div>
    </div>
  );
}
