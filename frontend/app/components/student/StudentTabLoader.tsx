import { Loader2 } from "lucide-react";

export function StudentTabLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-[#FF9F1C]" />
      <p className="font-bold text-[#FF9F1C] mt-2">Loading your dashboard…</p>
    </div>
  );
}
