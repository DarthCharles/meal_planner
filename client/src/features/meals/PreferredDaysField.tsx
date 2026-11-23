import { Button } from "@darthcharles/greda";
import { Controller, useFormContext } from "react-hook-form";

import { useI18n } from "../../i18n";
import type { MealForm } from "../../types";
import { dayLabel, weekdays } from "./preferredDays";

export function PreferredDaysField() {
  const { t } = useI18n();
  const { control } = useFormContext<MealForm>();
  return (
    <Controller
      name="preferred_days"
      control={control}
      render={({ field }) => (
        <fieldset
          aria-labelledby="preferred-days-label"
          className="text-label grid min-w-0 gap-xs text-foreground"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-sm gap-y-2xs">
            <span id="preferred-days-label">{t("meals.preferred_days.preferred_days")}</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0 text-label"
              disabled={field.value.length === 0}
              onBlur={field.onBlur}
              onClick={() => field.onChange([])}
            >
              {t("meals.preferred_days.clear_all")}
            </Button>
          </div>
          <p
            id="preferred-days-help"
            className="m-0 max-w-prose text-caption text-pretty text-muted-foreground"
          >
            {t("meals.preferred_days.preferred_days_help")}
          </p>
          <div className="flex flex-wrap gap-xs">
            {weekdays.map((day, index) => (
              <Button
                key={day}
                type="button"
                size="sm"
                variant="outline"
                className="aria-pressed:surface-tertiary aria-pressed:text-foreground aria-pressed:hover:surface-tertiary aria-pressed:hover:text-foreground"
                aria-pressed={field.value.includes(day)}
                aria-describedby="preferred-days-help"
                ref={index === 0 ? field.ref : undefined}
                onBlur={field.onBlur}
                onClick={() =>
                  field.onChange(
                    field.value.includes(day)
                      ? field.value.filter((value) => value !== day)
                      : [...field.value, day],
                  )
                }
              >
                {dayLabel(day)}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
    />
  );
}
