import { CreditCard, Shield } from "lucide-react";
import { ModalCloseButton } from "./ModalCloseButton";

export interface MockPaymentModalProps {
  open: boolean;
  description: string;
  paymentSessionId: string;
  amountInr: number;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MockPaymentModal({
  open,
  description,
  paymentSessionId,
  amountInr,
  currency = "INR",
  onSuccess,
  onCancel,
}: MockPaymentModalProps) {
  if (!open) return null;

  const amountLabel = `₹${amountInr.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-[#FF9F1C]" />
        <ModalCloseButton className="absolute top-3 right-3" onClick={onCancel} />

        <div className="mx-auto w-12 h-12 bg-[#FF9F1C]/10 rounded-full flex items-center justify-center text-xl mb-4 mt-2">
          🧪
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-[#FF9F1C]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#c77a00]">
            Simba Academy Checkout
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-1 text-center">Complete payment</h3>
        <p className="text-xs text-slate-500 font-medium mb-5 text-center leading-relaxed">
          Demo checkout for student registration and enrollment. No real payment is processed — click below to
          continue.
        </p>

        <div className="bg-[#FF9F1C]/5 rounded-xl p-4 border border-[#FF9F1C]/10 mb-5 space-y-2 text-left">
          <div className="flex justify-between text-xs font-semibold text-slate-500 gap-3">
            <span>Description</span>
            <span className="text-slate-800 font-bold text-right">{description}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 gap-3">
            <span>Session ID</span>
            <span className="text-slate-800 font-mono truncate max-w-[200px] font-bold">{paymentSessionId}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Currency</span>
            <span className="text-slate-800 font-bold">{currency}</span>
          </div>
          <div className="border-t border-dashed border-[#FF9F1C]/20 pt-2 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700">Total</span>
            <span className="text-2xl font-extrabold text-[#c77a00]">{amountLabel}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onSuccess}
            className="w-full py-3 rounded-xl bg-[#FF9F1C] hover:bg-[#e88f0a] text-white font-sans font-extrabold transition-colors shadow-md text-sm cursor-pointer"
          >
            Confirm payment
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold transition-colors text-sm cursor-pointer"
          >
            Cancel payment
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-4">
          <Shield className="w-3.5 h-3.5" />
          Test mode only · no real charge
        </p>
      </div>
    </div>
  );
}
