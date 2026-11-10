import { useState } from "react";
import { Button } from "@darthcharles/greda";
import { Notice } from "../../components/Notice";
import { useMealDialog } from "../meals/useMealDialog";
import { formatMenuDateRange, localDateKey } from "./menuDates";
import { MenuView } from "./MenuView";
import { useMenus } from "./queries";

export function MenuHistoryScreen() {
  const { data: menus, isPending: loading, error, refetch, isFetching } = useMenus();
  const { openMeal } = useMealDialog();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const today = localDateKey(new Date());
  const pastMenus = (menus ?? [])
    .filter((menu) => menu.to.slice(0, 10) < today)
    .sort((left, right) => right.from.localeCompare(left.from) || right.id - left.id);
  const selected = pastMenus.find((menu) => menu.id === selectedId) ?? pastMenus[0];

  return (
    <section aria-labelledby="history-title" className="py-5 tablet:py-8">
      <p className="mb-2 text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">Your weekly table</p>
      <h2 id="history-title" className="mb-3 font-display text-[32px] font-semibold tracking-[-.04em]">Menu history</h2>
      <p className="mb-6 text-sm text-muted-foreground">Revisit the meals you planned in previous weeks.</p>
      {error && (
        <div className="mb-5 space-y-3">
          <Notice>{error.message}</Notice>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Try again</Button>
        </div>
      )}
      {loading && <p role="status">Loading menu history…</p>}
      {!loading && !error && !pastMenus.length && (
        <div className="rounded-[20px] border border-border bg-card p-6">
          <h3 className="mb-2 font-display text-xl font-semibold">No past menus yet</h3>
          <p className="m-0 text-sm text-muted-foreground">Your saved menus will appear here after their week ends.</p>
        </div>
      )}
      {!!pastMenus.length && (
        <div className="grid min-w-0 gap-6 desktop:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Past menus" className="flex min-w-0 flex-col gap-2">
            {pastMenus.map((menu) => (
              <Button
                key={menu.id}
                variant={selected?.id === menu.id ? "secondary" : "outline"}
                aria-current={selected?.id === menu.id ? "true" : undefined}
                onClick={() => setSelectedId(menu.id)}
                className="h-auto min-h-11 justify-start whitespace-normal px-4 py-3 text-left"
              >
                {formatMenuDateRange(menu)}
              </Button>
            ))}
          </nav>
          {selected && (
            <section aria-labelledby="past-menu-title" className="min-w-0">
              <h3 id="past-menu-title" className="mb-4 font-display text-2xl font-semibold tracking-[-.04em]">{formatMenuDateRange(selected)}</h3>
              {!!selected.generation_notices?.length && (
                <Notice>
                  <div>
                    <p className="m-0 font-semibold">Some day preferences needed a fallback.</p>
                    <ul className="mt-2 mb-0 pl-5">
                      {selected.generation_notices.map((notice, index) => <li key={index}>{notice}</li>)}
                    </ul>
                  </div>
                </Notice>
              )}
              <MenuView menu={selected} loading={false} onOpenMeal={openMeal} startFromToday={false} />
            </section>
          )}
        </div>
      )}
    </section>
  );
}
