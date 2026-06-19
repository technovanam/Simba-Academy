export function DashboardSkeleton() {
  return (
    <div className="w-full flex-1 flex flex-col space-y-6 animate-pulse select-none pb-8">
      {/* Top Welcome Title skeleton */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3 mb-2">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded-lg"></div>
          <div className="h-3 w-40 bg-slate-100 rounded-md"></div>
        </div>
        <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Metric Cards Row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-[190px] bg-slate-100 border border-slate-200/50 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-16 bg-slate-300 rounded-lg"></div>
            <div className="h-10 w-full bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-3 w-28 bg-slate-200 rounded-md"></div>
        </div>

        <div className="h-[190px] bg-slate-100 border border-slate-200/50 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-20 bg-slate-300 rounded-lg"></div>
            <div className="h-10 w-full bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-3 w-28 bg-slate-200 rounded-md"></div>
        </div>

        <div className="h-[190px] bg-slate-100 border border-slate-200/50 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-12 bg-slate-300 rounded-lg"></div>
            <div className="h-10 w-full bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-3 w-28 bg-slate-200 rounded-md"></div>
        </div>
      </div>

      {/* Lower Split Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch flex-1">
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-slate-300 rounded-md"></div>
              <div className="h-3.5 w-48 bg-slate-200 rounded-md"></div>
            </div>
            <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="h-16 w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
            <div className="h-16 w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
            <div className="h-16 w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="h-4 w-28 bg-slate-300 rounded-md"></div>
            <div className="h-4 w-4 bg-slate-200 rounded-md"></div>
          </div>
          <div className="space-y-2 flex-1">
            <div className="h-12 w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-slate-200/60 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FullPortalSkeleton() {
  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden animate-pulse select-none">
      {/* Sidebar skeleton */}
      <aside className="w-72 bg-slate-100 border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 hidden lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-slate-200/50 p-2 rounded-xl">
            <div className="h-8 w-15 bg-slate-300 rounded-lg"></div>
            <div className="space-y-1 flex-1">
              <div className="h-3.5 w-24 bg-slate-300 rounded"></div>
              <div className="h-2 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-2 w-10 bg-slate-300 rounded mb-4"></div>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-9 w-full bg-slate-200/80 rounded-xl"></div>
            ))}
          </div>
        </div>
        <div className="h-9 w-full bg-slate-200 rounded-xl"></div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
        {/* Header skeleton */}
        <div className="h-14 w-full bg-slate-100 border border-slate-200/50 rounded-xl flex items-center justify-between px-4 shrink-0 lg:hidden">
          <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
        </div>

        <div className="flex-1 flex flex-col space-y-6">
          {/* Welcome/Overview block */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
              <div className="h-3 w-32 bg-slate-100 rounded-md"></div>
            </div>
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          </div>

          {/* Cards block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-100 border border-slate-200/50 rounded-2xl"></div>
            ))}
          </div>

          {/* Bottom columns block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200/80 rounded-2xl"></div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
