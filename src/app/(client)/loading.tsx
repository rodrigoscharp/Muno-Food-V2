export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Category nav skeleton */}
      <div className="sticky top-16 z-30 bg-white border-b border-neutral-200 mb-8">
        <div className="flex gap-2 py-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 rounded-full bg-neutral-100 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Category sections skeleton */}
      {[...Array(2)].map((_, s) => (
        <div key={s} className="mb-12">
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="h-40 bg-neutral-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-full" />
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-2/3" />
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-neutral-100 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
