import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { normalize } from "@/lib/br";
import { cn } from "@/lib/utils";

/** Text input that filters a list as you type; only values from the list are accepted. */
export function Autocomplete({ id, options, value, onChange, disabled, placeholder }: {
  id: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  const current = options.find((o) => o.value === value)?.label ?? "";
  const [text, setText] = useState(current);
  const [open, setOpen] = useState(false);
  useEffect(() => setText(current), [current]);
  const q = normalize(text);
  const list = options.filter((o) => normalize(o.label).includes(q)).sort((a, b) => +!normalize(a.label).startsWith(q) - +!normalize(b.label).startsWith(q)).slice(0, 60);

  return (
    <div className="relative mt-1.5">
      <Input id={id} value={text} disabled={disabled} placeholder={placeholder} autoComplete="off" className="h-11"
        onChange={(e) => { setText(e.target.value); setOpen(true); if (value) onChange(""); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => { setOpen(false); setText((t) => (options.find((o) => o.value === value) ? t : "")); }, 150)} />
      {open && !disabled && list.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lift">
          {list.map((o) => (
            <li key={o.value}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(o.value); setText(o.label); setOpen(false); }}
                className={cn("w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted", o.value === value && "bg-primary/10 font-semibold text-primary")}>{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
