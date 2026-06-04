import { AdminModal } from "./AdminModal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AdminModal open={open} onClose={onCancel} title={title} maxWidth="sm">
      <p className="text-sm text-slate-600 font-medium mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-xl font-bold text-xs text-white transition disabled:opacity-50 flex items-center gap-2 ${
            variant === "danger"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-[#8AC926] hover:bg-[#78B020]"
          }`}
        >
          {loading ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}
