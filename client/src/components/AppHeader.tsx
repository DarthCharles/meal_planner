import { Fragment, useRef, useState } from "react";

import {
  Button,
  buttonVariants,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@darthcharles/greda";
import { Ellipsis, Plus } from "@darthcharles/greda/icons";
import { Link, NavLink, useLocation, useNavigate } from "react-router";

import { useMealDialog } from "../features/meals/useMealDialog";
import { useGenerateMenu, useMenus } from "../features/menu/queries";
import { useI18n } from "../i18n";
import { FlowerArt } from "./FlowerArt";
import { Notice } from "./Notice";

export function AppHeader() {
  const { t, locale, setLocale } = useI18n();
  const { openCreateMeal } = useMealDialog();
  const { isPending: loadingMenus } = useMenus();
  const { mutate: generateMenu, isPending: generating, error: generationError } = useGenerateMenu();
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsTrigger = useRef<HTMLButtonElement>(null);
  const menuLink = useRef<HTMLAnchorElement>(null);
  const addingMeal = useRef(false);
  const pendingDestination = useRef<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <header className="flex h-[70px] items-center justify-between gap-2 tablet:h-[86px]">
        <Link
          to="/"
          aria-label={t("app_header.home")}
          className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring tablet:gap-[11px]"
        >
          <div className="grid size-[44px] -rotate-6 place-items-center rounded-[12px_12px_12px_4px] bg-primary">
            <FlowerArt className="h-auto w-[40px] rotate-6" />
          </div>
          <div>
            <p className="hidden">{t("common.weekly_table")}</p>
            <h1 className="m-0 font-display text-[24px] font-bold tracking-[-.04em] tablet:text-[27px]">
              comal
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-auto min-h-11 gap-1 px-2 text-xs tablet:gap-2 tablet:px-3"
            disabled={loadingMenus || generating}
            onClick={() => generateMenu()}
          >
            {generating ? (
              <Ellipsis aria-hidden="true" className="size-4 shrink-0" />
            ) : (
              <Plus aria-hidden="true" className="size-4 shrink-0" />
            )}
            {generating ? t("app_header.planning") : t("app_header.plan_week")}
          </Button>
          <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={actionsTrigger}
                variant="outline"
                className="h-auto min-h-11 min-w-11 shrink-0 px-2 text-xs tablet:px-3 tablet:text-sm"
              >
                {t("app_header.menu")}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="flex w-64 max-w-[calc(100vw-30px)] flex-col gap-1 p-1.5"
              aria-label={t("app_header.navigation_menu")}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                menuLink.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                const destination = pendingDestination.current;
                pendingDestination.current = null;
                if (destination !== null) {
                  event.preventDefault();
                  actionsTrigger.current?.focus();
                  // Leave the exiting popover's keyboard layer before showing the new screen.
                  navigate(destination, { replace: destination === location.pathname });
                } else if (addingMeal.current) {
                  event.preventDefault();
                  addingMeal.current = false;
                  // Close the popover before entering the editor; retain Menu as the return target.
                  actionsTrigger.current?.focus();
                  openCreateMeal();
                }
              }}
            >
              <nav className="flex flex-col gap-1" aria-label={t("navigation.primary_navigation")}>
                {(
                  [
                    ["/", t("navigation.my_menu")],
                    ["/meals", t("navigation.my_meals")],
                    ["/ingredients", t("navigation.my_ingredients")],
                    ["/saved-menus", t("navigation.saved_menus")],
                  ] as const
                ).map(([destination, label]) => (
                  <Fragment key={destination}>
                    {destination === "/saved-menus" && <hr className="my-1 border-border" />}
                    <NavLink
                      ref={destination === "/" ? menuLink : undefined}
                      to={destination}
                      end
                      className={({ isActive }) =>
                        buttonVariants({
                          variant: isActive ? "default" : "ghost",
                          className: "min-h-11 w-full justify-start",
                        })
                      }
                      onClick={(event) => {
                        if (
                          event.button !== 0 ||
                          event.metaKey ||
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey
                        )
                          return;
                        event.preventDefault();
                        pendingDestination.current = destination;
                        setActionsOpen(false);
                      }}
                    >
                      {label}
                    </NavLink>
                  </Fragment>
                ))}
              </nav>
              <hr className="my-1 border-border" />
              <Button
                variant="ghost"
                className="min-h-11 w-full justify-start"
                onClick={() => {
                  addingMeal.current = true;
                  setActionsOpen(false);
                }}
              >
                {t("app_header.add_meal_action")}
              </Button>
              <hr className="my-1 border-border" />
              <div role="group" aria-label={t("app_header.language")} className="flex gap-1">
                {(
                  [
                    ["en", "English"],
                    ["es", "Español"],
                  ] as const
                ).map(([code, label]) => (
                  <Button
                    key={code}
                    lang={code}
                    variant={locale === code ? "default" : "ghost"}
                    size="sm"
                    className="min-h-11 flex-1"
                    aria-pressed={locale === code}
                    onClick={() => setLocale(code)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      {generationError && <Notice>{generationError.message}</Notice>}
    </>
  );
}
