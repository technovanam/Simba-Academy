import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  readOnly?: boolean;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  "data-lpignore"?: string;
  "data-1p-ignore"?: string;
  "data-bwignore"?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  minLength,
  className = "w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 bg-white text-sm outline-none focus:border-[#8AC926]",
  id,
  name,
  autoComplete = "off",
  readOnly,
  onFocus,
  "data-lpignore": dataLpignore,
  "data-1p-ignore": data1pIgnore,
  "data-bwignore": dataBwignore,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        id={id}
        name={name}
        required={required}
        minLength={minLength}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onFocus={onFocus}
        data-lpignore={dataLpignore}
        data-1p-ignore={data1pIgnore}
        data-bwignore={dataBwignore}
        className={className}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}
