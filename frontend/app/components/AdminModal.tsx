import { useEffect, type ReactNode } from "react";
import { ModalCloseButton } from "./ModalCloseButton";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

export function AdminModal({ open, onClose, title, children, maxWidth = "md" }: AdminModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const widthClass =
    maxWidth === "sm" ? "max-w-sm" : maxWidth === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`bg-white rounded-2xl p-7 w-full ${widthClass} shadow-2xl border border-slate-200 animate-scale-up relative`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <ModalCloseButton onClick={onClose} className="absolute top-4 right-4" />
        <h3 id="admin-modal-title" className="font-sans text-lg font-extrabold text-slate-900 pr-10 mb-5">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
