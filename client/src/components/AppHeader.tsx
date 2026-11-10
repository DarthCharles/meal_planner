import { Fragment, useRef, useState } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@darthcharles/greda";
import { useMealDialog } from "../features/meals/useMealDialog";
import { useGenerateMenu, useMenus } from "../features/menu/queries";
import { Notice } from "./Notice";
import { BowlLogo } from "./BowlLogo";
import type { NavigationProps } from "./Navigation";

export function AppHeader({ view, onNavigate }: NavigationProps) {
  const { openCreateMeal } = useMealDialog();
  const { isPending: loadingMenus } = useMenus();
  const {
    mutate: generateMenu,
    isPending: generating,
    error: generationError,
  } = useGenerateMenu();
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsTrigger = useRef<HTMLButtonElement>(null);
  const addingMeal = useRef(false);
  return (
    <>
      <header className="flex h-[70px] items-center justify-between gap-2 tablet:h-[86px]">
        <a
          href="/"
          aria-label="Comal home"
          className="flex items-center gap-[11px] rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onNavigate("menu");
          }}
        >
          <div className="grid size-[39px] -rotate-6 place-items-center rounded-[12px_12px_12px_4px] bg-primary text-primary-foreground">
            <BowlLogo />
          </div>
          <div>
            <p className="hidden">Your weekly table</p>
            <h1 className="m-0 font-display text-[27px] font-bold tracking-[-.06em]">
              comal
            </h1>
          </div>
        </a>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1 px-2 text-xs tablet:gap-2 tablet:px-3"
            disabled={loadingMenus || generating}
            onClick={() => generateMenu()}
          >
            <span aria-hidden="true" className="text-xl leading-none font-normal">
              {generating ? "…" : "+"}
            </span>
            {generating ? "Planning" : "Plan my week"}
          </Button>
          <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={actionsTrigger}
                variant="outline"
                size="icon"
                className="rounded-full text-[11px]"
                aria-label="Open actions"
              >
                MC
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="flex w-48 flex-col gap-1 p-1.5"
              aria-label="Actions"
              onCloseAutoFocus={(event) => {
                if (addingMeal.current) {
                  event.preventDefault();
                  addingMeal.current = false;
                  // Open after the popover closes so the dialog restores focus to MC.
                  actionsTrigger.current?.focus();
                  openCreateMeal();
                }
              }}
            >
              <nav className="flex flex-col gap-1" aria-label="Primary navigation">
                {([
                  ["menu", "My Menu"],
                  ["meals", "My Meals"],
                  ["savedMenus", "Saved Menus"],
                ] as const).map(([destination, label]) => (
                  <Fragment key={destination}>
                    {destination === "savedMenus" && <hr className="my-1 border-border" />}
                    <Button
                      variant={view === destination ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      aria-current={view === destination ? "page" : undefined}
                      onClick={() => {
                        onNavigate(destination);
                        setActionsOpen(false);
                      }}
                    >
                      {label}
                    </Button>
                  </Fragment>
                ))}
              </nav>
              <hr className="my-1 border-border" />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  addingMeal.current = true;
                  setActionsOpen(false);
                }}
              >
                Add a meal
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      {generationError && <Notice>{generationError.message}</Notice>}
    </>
  );
}
