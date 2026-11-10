const shimmer = "animate-shimmer bg-skeleton bg-size-[200%_100%] motion-reduce:animate-none";

export function MealsSkeleton() {
  return (
    <div role="status" aria-label="Loading meals" aria-busy="true">
      <span className="sr-only">Loading meals…</span>
      <div aria-hidden="true">
        <div className="flex flex-col gap-[10px] tablet:flex-row">
          <div className={`h-[43px] flex-1 rounded-xl ${shimmer}`} />
          <div className={`h-[43px] w-[110px] rounded-xl ${shimmer}`} />
        </div>
        <div className="my-[18px] flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`h-8 w-20 shrink-0 rounded-full ${shimmer}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-[14px] tablet:grid-cols-2 wide:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex min-h-[143px] gap-[15px] rounded-[17px] border border-border bg-card pt-5 pr-[18px] pb-[18px] pl-[23px]"
            >
              <div className="min-w-0 flex-1">
                <div className={`h-5 w-16 rounded-[5px] ${shimmer}`} />
                <div className={`mt-[10px] mb-[6px] h-5 w-3/4 rounded ${shimmer}`} />
                <div className={`mb-2 h-3 w-full rounded ${shimmer}`} />
                <div className={`h-3 w-2/3 rounded ${shimmer}`} />
              </div>
              <div className={`h-8 w-10 shrink-0 rounded-md ${shimmer}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
