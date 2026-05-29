import { Skeleton } from "@/components/ui/skeleton";

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card">
        <div className="px-4 py-6 border-b border-border space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md px-3 py-2"
            >
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-56 rounded-full" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4"
                  >
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
