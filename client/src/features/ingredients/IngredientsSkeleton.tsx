const shimmer = "animate-shimmer bg-skeleton bg-size-[200%_100%] motion-reduce:animate-none";

export function IngredientsSkeleton() {
  return (
    <div role="status" aria-label="Loading ingredients" aria-busy="true">
      <span className="sr-only">Loading ingredients…</span>
      <div aria-hidden="true">
        <div className={`mb-3 h-4 w-28 rounded ${shimmer}`} />
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 wide:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="min-w-0 rounded-xl border border-border bg-card px-4 py-4">
              <div className="flex items-center gap-3">
                <div className={`h-5 min-w-0 flex-1 rounded ${shimmer}`} />
                <div className={`h-8 w-12 shrink-0 rounded-md ${shimmer}`} />
              </div>
              <div className={`mt-2 h-7 w-32 max-w-full rounded-full ${shimmer}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
