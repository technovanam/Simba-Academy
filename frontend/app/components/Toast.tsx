import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

const STACK_OFFSETS = ["top-4", "top-[5.75rem]", "top-[11.5rem]"] as const;

function compactMessage(message: string, maxLength = 240): string {
  const trimmed = message.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  /** Auto-hide after this many ms (0 = only manual dismiss). */
  autoDismissMs?: number;
  /** Stack multiple toasts vertically (0 = top). */
  stackIndex?: number;
}

export function Toast({
  message,
  variant = "error",
  onDismiss,
  autoDismissMs,
  stackIndex = 0,
}: ToastProps) {
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dismissMs = autoDismissMs ?? (variant === "error" ? 10_000 : 5_000);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onDismiss();
      setClosing(false);
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!message) return;
    setClosing(false);
    
    const handleGlobalClick = () => dismiss();
    const clickDelayTimer = setTimeout(() => {
      window.addEventListener("click", handleGlobalClick);
    }, 100);

    if (dismissMs <= 0) {
      return () => {
        clearTimeout(clickDelayTimer);
        window.removeEventListener("click", handleGlobalClick);
      };
    }
    
    const timer = setTimeout(dismiss, dismissMs);
    return () => {
      clearTimeout(timer);
      clearTimeout(clickDelayTimer);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, [message, dismissMs, dismiss]);

  if (!mounted || !message) return null;

  const style = VARIANT_STYLES[variant];
  const Icon = style.Icon;
  const stackClass = STACK_OFFSETS[stackIndex] ?? STACK_OFFSETS[0];
  const displayMessage = compactMessage(message);

  const toast = (
    <div
      role="alert"
      className={`toast-notification fixed ${stackClass} right-4 sm:right-6 z-[200] w-[min(18rem,calc(100vw-2rem))] sm:w-[min(20rem,calc(100vw-3rem))] bg-white/95 backdrop-blur-lg border ${style.border} rounded-xl shadow-xl overflow-hidden flex text-left pointer-events-auto ${closing ? "animate-toast-out" : "animate-toast-in"}`}
    >
      <div className={`w-1.5 ${style.bar} flex-shrink-0`} />
      <div className="p-3 sm:p-3.5 flex gap-2.5 items-start w-full min-w-0">
        <Icon className={`w-4 h-4 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-800 leading-tight">{style.title}</h4>
          <p
            className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1 break-words leading-snug line-clamp-4 max-h-[4.5rem] overflow-y-auto scrollbar-hide"
            title={message.length > displayMessage.length ? message : undefined}
          >
            {displayMessage}
          </p>
        </div>
        <ModalCloseButton
          size="sm"
          className="shrink-0 -mr-0.5"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
        />
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}

/** Error + success toasts for portal layouts — stacked compact alerts on desktop. */
export function PortalToasts({
  error,
  message,
  onDismissError,
  onDismissSuccess,
}: {
  error: string;
  message: string;
  onDismissError: () => void;
  onDismissSuccess: () => void;
}) {
  const hasError = Boolean(error);

  return (
    <>
      <Toast message={error} variant="error" onDismiss={onDismissError} stackIndex={0} />
      <Toast
        message={message}
        variant="success"
        onDismiss={onDismissSuccess}
        stackIndex={hasError ? 1 : 0}
      />
    </>
  );
}
