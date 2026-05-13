export default function Loading() {
  return (
    <div className="min-h-screen bg-background-light flex flex-col items-center justify-center gap-6">
      {/* Logo pulse */}
      <div className="relative">
        <div className="size-16 rounded-full bg-primary/20 animate-ping absolute inset-0"></div>
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center relative">
          <div className="size-10 rounded-full bg-primary/30 animate-pulse"></div>
        </div>
      </div>
      
      {/* Skeleton content */}
      <div className="w-full max-w-[1200px] px-8 space-y-8 mt-12">
        {/* Nav skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-full bg-surface animate-pulse"></div>
            <div className="h-6 w-32 rounded-lg bg-surface animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-20 rounded-full bg-surface animate-pulse"></div>
            <div className="h-10 w-20 rounded-full bg-surface animate-pulse"></div>
          </div>
        </div>

        {/* Banner skeleton */}
        <div className="h-[400px] rounded-[40px] bg-surface animate-pulse"></div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4.5] rounded-[24px] bg-surface animate-pulse"></div>
              <div className="h-4 w-3/4 rounded bg-surface animate-pulse"></div>
              <div className="h-3 w-1/2 rounded bg-surface animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
