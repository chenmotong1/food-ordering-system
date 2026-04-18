import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-[var(--color-border)] rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="border border-[var(--color-border)] rounded-lg p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-64 w-full rounded" />
      </div>

      {/* Table skeleton */}
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 py-3 flex gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-[var(--color-border)] px-4 py-3 flex gap-4">
            {[...Array(6)].map((_, j) => (
              <Skeleton key={j} className="h-5 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
