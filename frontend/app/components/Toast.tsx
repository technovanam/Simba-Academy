import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { ModalCloseButton } from "./ModalCloseButton";

export type ToastVariant = "error" | "success" | "info";

const VARIANT_STYLES: Record<
  ToastVariant,
  { bar: string; border: string; Icon: typeof AlertCircle; iconColor: string; title: string }
> = {
  error: {
    bar: "bg-red-500",
    border: "border-red-100",
    Icon: AlertCircle,
    iconColor: "text-red-500",
    title: "Error",
  },
  success: {
    bar: "bg-emerald-500",
    border: "border-emerald-100",
    Icon: CheckCircle2,
    iconColor: "text-emerald-500",
    title: "Success",
  },
  info: {
    bar: "bg-blue-500",
    border: "border-blue-100",
    Icon: Info,
    iconColor: "text-blue-500",
    title: "Notice",
  },
};

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  /** Auto-hide after this many ms (0 = only manual dismiss). */
  autoDismissMs?: number;
}

export function Toast({
  message,
  variant = "error",
  onDismiss,
  autoDismissMs,
}: ToastProps) {
  const [closing, setClosing] = useState(false);
  const dismissMs = autoDismissMs ?? (variant === "error" ? 10_000 : 5_000);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onDismiss();
      setClosing(false);
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;
    setClosing(false);
    if (dismissMs <= 0) return;
    const timer = setTimeout(dismiss, dismissMs);
    return () => clearTimeout(timer);
  }, [message, dismissMs, dismiss]);

  if (!message) return null;

  const style = VARIANT_STYLES[variant];
  const Icon = style.Icon;

  return (
    <div
      role="alert"
      className={`fixed top-6 right-6 z-[200] max-w-md w-[calc(100%-2rem)] sm:w-full sm:max-w-sm bg-white/95 backdrop-blur-lg border ${style.border} rounded-2xl shadow-xl overflow-hidden flex text-left pointer-events-auto ${closing ? "animate-toast-out" : "animate-toast-in"}`}
    >
      <div className={`w-2 ${style.bar} flex-shrink-0`} />
      <div className="p-4 flex gap-3.5 items-start w-full min-w-0">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 leading-tight">{style.title}</h4>
          <p className="text-xs text-slate-600 font-medium mt-1 break-words">{message}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-2 block">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <ModalCloseButton
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
        />
      </div>
    </div>
  );
}
