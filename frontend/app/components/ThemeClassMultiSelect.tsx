import { STUDENT_CLASS_OPTIONS } from "../lib/constants";

interface ThemeClassMultiSelectProps {
  value: string[];
  onChange: (classes: string[]) => void;
  label?: string;
  disabled?: boolean;
}

export function ThemeClassMultiSelect({
  value,
  onChange,
  label,
  disabled = false,
}: ThemeClassMultiSelectProps) {
  const selected = new Set(value);

  function toggle(cls: string, checked: boolean) {
    if (disabled) return;
    const next = new Set(value);
    if (checked) {
      next.add(cls);
    } else {
      next.delete(cls);
    }
    onChange([...next]);
  }

  return (
    <div>
      {label ? (
        <label className="block text-slate-700 font-bold mb-1 text-2xs uppercase tracking-wider">
          {label}
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {STUDENT_CLASS_OPTIONS.map((opt) => {
          const isChecked = selected.has(opt.id);
          return (
            <label
              key={opt.id}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition select-none ${
                disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer"
              } ${
                isChecked
                  ? "bg-[#8AC926]/10 border-[#8AC926]/40 text-[#5a8a18] font-bold"
                  : "bg-white border-slate-200 text-slate-650 hover:border-[#8AC926]/50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={disabled}
                onChange={(e) => toggle(opt.id, e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#8AC926] focus:ring-[#8AC926]/30"
              />
              <span className="text-xs">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
