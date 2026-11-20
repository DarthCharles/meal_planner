import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";

import { Button, Checkbox } from "@darthcharles/greda";

import { formatLocale, unitLabel, useI18n } from "../../i18n";
import type { ShoppingList } from "../../types";
import { useWorkspaceNavigation } from "../navigation/useWorkspaceNavigation";
import { formatMenuDateRange } from "./menuDates";

function itemKey(item: ShoppingList["items"][number]) {
  return `${item.ingredient_id}-${item.unit}-${item.quantity}`;
}

function readChecks(storageKey: string) {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return new Set<string>(
      Array.isArray(saved) ? saved.filter((key): key is string => typeof key === "string") : [],
    );
  } catch {
    return new Set<string>();
  }
}

export function ShoppingReceipt({
  list,
  controls,
  updateAction,
}: {
  list: ShoppingList;
  controls: ReactNode;
  updateAction: ReactNode;
}) {
  const { t } = useI18n();
  const { preview } = useWorkspaceNavigation();
  const storageKey = `comal.shopping-checks.v1.${list.menu_id}`;
  const [checked, setChecked] = useState<Set<string>>(() => readChecks(storageKey));
  useEffect(() => {
    const current = new Set(list.items.map(itemKey));
    setChecked((previous) =>
      previous.size && [...previous].some((key) => !current.has(key))
        ? new Set([...previous].filter((key) => current.has(key)))
        : previous,
    );
  }, [list.items]);
  useEffect(() => {
    try {
      const currentChecks = list.items.map(itemKey).filter((key) => checked.has(key));
      localStorage.setItem(storageKey, JSON.stringify(currentChecks));
    } catch {
      // Checking items still works when browser storage is unavailable.
    }
  }, [checked, list.items, storageKey]);
  const collator = new Intl.Collator(formatLocale(), { sensitivity: "base" });
  const number = new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 3 });
  const checkedCount = list.items.filter((item) => checked.has(itemKey(item))).length;

  const groups = [...list.categories]
    .sort((a, b) => a.position - b.position)
    .map(({ code }) => {
      const items = list.items
        .filter((item) => item.shopping_category === code)
        .sort(
          (a, b) =>
            collator.compare(a.name, b.name) ||
            a.ingredient_id - b.ingredient_id ||
            collator.compare(a.unit, b.unit),
        );
      return { code, items };
    })
    .filter(({ items }) => items.length > 0);

  return (
    <ReceiptPaper label={t("shopping_list.receipt")}>
      <header className="border-b border-dashed border-border pb-4 text-center">
        <p className="mt-0 mb-2 text-xl font-bold tracking-[.18em]">COMAL</p>
        <p className="m-0 text-muted-foreground">{formatMenuDateRange(list)}</p>
        <p className="mt-1 mb-0">{t("shopping_list.people", { count: list.people_count })}</p>
        <details className="mt-2 font-sans">
          <summary className="mx-auto min-h-11 w-fit cursor-pointer content-center rounded-sm px-3 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {t("shopping_list.adjust")}
          </summary>
          {controls}
          <div className="mt-2 flex justify-center">{updateAction}</div>
        </details>
      </header>
      {!!list.items.length && (
        <div className="sticky top-0 z-[1] border-b border-dashed border-border bg-card py-3">
          <p role="status" className="m-0 text-center font-bold tabular-nums">
            {t("shopping_list.checked", { checked: checkedCount, count: list.items.length })}
          </p>
        </div>
      )}
      {!list.items.length && (
        <p className="my-6 text-center text-muted-foreground">{t("shopping_list.empty")}</p>
      )}
      <div className="mt-5 columns-1 gap-8 desktop:columns-2 min-[1100px]:columns-3">
        {groups.map(({ code, items }) => (
          <section
            key={code}
            aria-labelledby={`category-${code}`}
            className="mb-8 min-w-0 break-inside-avoid-column"
          >
            <h3
              id={`category-${code}`}
              className="mb-1 border-b border-dashed border-border pb-2 text-xs font-bold uppercase tracking-wide"
            >
              {t(`reference.shopping_categories.${code}`)}
            </h3>
            <div
              aria-hidden="true"
              className="mt-3 flex justify-between gap-3 text-[10px] uppercase tracking-widest text-muted-foreground"
            >
              <span>{t("shopping_list.ingredient")}</span>
              <span>{t("shopping_list.amount")}</span>
            </div>
            <ul className="m-0 list-none p-0">
              {items.map((item) => {
                const key = itemKey(item);
                const isChecked = checked.has(key);
                const quantity = `${number.format(Number(item.quantity))} ${unitLabel(item.unit, Number(item.quantity))}`;
                return (
                  <li key={key}>
                    <div className="flex min-h-14 min-w-0 items-start gap-1">
                      <label className="flex min-h-14 w-11 shrink-0 cursor-pointer items-start justify-center pt-4">
                        <Checkbox
                          className="shrink-0"
                          aria-label={`${item.name}, ${quantity}`}
                          checked={isChecked}
                          onCheckedChange={(value) =>
                            setChecked((previous) => {
                              const next = new Set(previous);
                              if (value === true) next.add(key);
                              else next.delete(key);
                              return next;
                            })
                          }
                        />
                      </label>
                      <span
                        className={`min-w-0 flex-1 py-4 ${isChecked ? "text-muted-foreground" : ""}`}
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          <Button
                            type="button"
                            variant="link"
                            className={`h-auto min-w-0 whitespace-normal break-words px-0 py-0 text-left font-mono text-sm font-normal text-inherit ${isChecked ? "line-through" : ""}`}
                            onClick={() =>
                              preview({ ingredient: item.ingredient_id, name: item.name })
                            }
                          >
                            {item.name}
                          </Button>
                          <span
                            aria-hidden="true"
                            className="min-w-2 flex-1 border-b border-dashed border-border"
                          />
                          <span
                            className={`max-w-[45%] shrink-0 break-words text-right tabular-nums ${isChecked ? "line-through" : ""}`}
                          >
                            {quantity}
                          </span>
                        </span>
                        {item.approximate && (
                          <span className="mt-1 block text-[10px] text-muted-foreground tablet:text-xs">
                            {t("shopping_list.approximate")}
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <footer className="mt-5 border-t border-dashed border-border pt-4 text-center text-muted-foreground">
        <p className="m-0 text-xs">{t("shopping_list.checklist_help")}</p>
        <p className="mt-3 mb-0 text-[10px] tablet:text-xs">{t("shopping_list.live")}</p>
      </footer>
    </ReceiptPaper>
  );
}

function ReceiptPaper({ children, label }: { children: ReactNode; label: string }) {
  const tearId = useId();
  return (
    <section
      aria-label={label}
      className="relative mx-auto mb-8 w-full min-w-0 bg-card px-4 pt-5 pb-6 font-mono text-sm leading-relaxed shadow-md tablet:px-6"
    >
      {children}
      <svg aria-hidden="true" className="absolute top-full left-0 h-3 w-full text-card">
        <defs>
          <pattern id={tearId} width="20" height="12" patternUnits="userSpaceOnUse">
            <path fill="currentColor" d="M0 0H20V2L10 12 0 2Z" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${tearId})`} />
      </svg>
    </section>
  );
}
