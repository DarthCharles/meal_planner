import { useState } from "react";
import { Button } from "@darthcharles/greda";
import { Notice } from "../../components/Notice";
import { useMealDialog } from "../meals/useMealDialog";
import { formatMenuDateRange, menuPeriod } from "./menuDates";
import { MenuView } from "./MenuView";
import { useMenus } from "./queries";

export function SavedMenusScreen() {
  const { data: menus, isPending: loading, error, refetch, isFetching } = useMenus();
  const { openMeal } = useMealDialog();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const now = new Date();
  const savedMenus = [...(menus ?? [])]
    .sort((left, right) => right.from.localeCompare(left.from) || right.id - left.id);
  const selected = savedMenus.find((menu) => menu.id === selectedId) ?? savedMenus[0];

  return (
    <section aria-labelledby="saved-menus-title" className="pb-5 tablet:pb-8">
      <p className="mb-2 text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">Your weekly table</p>
      <h2 id="saved-menus-title" className="mb-3 font-display text-[32px] font-semibold tracking-[-.04em]">Saved Menus</h2>
      <p className="mb-6 text-sm text-muted-foreground">Browse upcoming plans, this week's menu, and past weeks.</p>
      {error && (
        <div className="mb-5 space-y-3">
          <Notice>{error.message}</Notice>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Try again</Button>
        </div>
      )}
      {loading && <p role="status">Loading saved menus…</p>}
      {!loading && !error && !savedMenus.length && (
        <div className="rounded-[20px] border border-border bg-card p-6">
          <h3 className="mb-2 font-display text-xl font-semibold">No saved menus yet</h3>
          <p className="m-0 text-sm text-muted-foreground">Your weekly plans will appear here when they are saved.</p>
        </div>
      )}
      {!!savedMenus.length && (
        <div className="grid min-w-0 gap-6 desktop:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Saved weeks" className="flex min-w-0 flex-col gap-2">
            {savedMenus.map((menu) => (
              <Button
                key={menu.id}
                variant={selected?.id === menu.id ? "secondary" : "outline"}
                aria-current={selected?.id === menu.id ? "true" : undefined}
                onClick={() => setSelectedId(menu.id)}
                className="h-auto min-h-11 flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left"
              >
                <span>{formatMenuDateRange(menu)}</span>
                <span className="text-xs text-muted-foreground">{menuPeriod(menu, now)}</span>
              </Button>
            ))}
          </nav>
          {selected && (
            <section aria-labelledby="saved-menu-title" className="min-w-0">
              <p className="mb-2 text-sm text-muted-foreground">{menuPeriod(selected, now)}</p>
              <h3 id="saved-menu-title" className="mb-4 font-display text-2xl font-semibold tracking-[-.04em]">{formatMenuDateRange(selected)}</h3>
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
