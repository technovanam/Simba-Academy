import { Loader2 } from "lucide-react";

export function AdminTabLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-[#8AC926]" />
      <p className="font-bold text-[#8AC926] mt-2">Loading dashboard data…</p>
    </div>
  );
}
