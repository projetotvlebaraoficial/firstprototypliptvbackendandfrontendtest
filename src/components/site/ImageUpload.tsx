import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png"];

/** Returns an error message for files that are not JPG/JPEG/PNG or exceed 3 MB. */
export function imageFileError(f: { name: string; type: string; size: number }) {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.includes(f.type) || !["jpg", "jpeg", "png"].includes(ext)) return "Envie apenas imagens JPG, JPEG ou PNG.";
  if (f.size > MAX_IMAGE_BYTES) return "A imagem deve ter no máximo 3 MB.";
  return null;
}

/** Drag-and-drop / click upload to the media bucket. Calls onChange with a long-lived URL. */
export function ImageUpload({ value, onChange, folder }: { value: string | null; onChange: (url: string | null) => void; folder: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function upload(file: File) {
    const err = imageFileError(file);
    if (err) return void toast.error(err);
    setBusy(true);
    const ext = file.name.split(".").pop()!.toLowerCase();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); return void toast.error("Não foi possível enviar a imagem."); }
    const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 20);
    setBusy(false);
    if (!data) return void toast.error("Não foi possível enviar a imagem.");
    onChange(data.signedUrl);
    toast.success("Imagem enviada");
  }

  if (value)
    return (
      <div className="relative mt-1.5 overflow-hidden rounded-xl border">
        <img src={value} alt="Capa" className="aspect-video w-full object-cover" />
        <button type="button" onClick={() => onChange(null)} className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow" aria-label="Remover imagem"><X className="h-4 w-4" /></button>
      </div>
    );

  return (
    <div
      onClick={() => input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) void upload(f); }}
      className={cn("mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition", over && "border-primary bg-primary/5")}
    >
      {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-primary" />}
      <p><span className="font-semibold text-foreground">Clique ou arraste</span> uma imagem aqui</p>
      <p className="text-xs">Somente JPG, JPEG ou PNG · até 3 MB</p>
      <input ref={input} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
    </div>
  );
}
