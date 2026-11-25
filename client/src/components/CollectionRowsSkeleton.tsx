const shimmer = "animate-shimmer bg-skeleton bg-size-[200%_100%] motion-reduce:animate-none";

export function CollectionRowsSkeleton() {
  return (
    <>
      <div className={`mb-sm h-4 w-28 rounded ${shimmer}`} />
      <div className="surface-raised divide-y divide-border rounded-xl border border-border">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="grid gap-2xs px-sm py-sm">
            <div className={`h-6 w-40 max-w-full rounded ${shimmer}`} />
            <div className={`h-4 w-24 max-w-full rounded ${shimmer}`} />
          </div>
        ))}
      </div>
    </>
  );
}
