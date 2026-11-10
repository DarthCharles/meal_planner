import { Button } from "@darthcharles/greda";
import { Controller, useFormContext } from "react-hook-form";
import type { MealForm } from "../../types";
import { dayLabel, weekdays } from "./preferredDays";

export function PreferredDaysField() {
  const { control } = useFormContext<MealForm>();
  return (
    <Controller
      name="preferred_days"
      control={control}
      render={({ field }) => (
        <fieldset
          aria-labelledby="preferred-days-label"
          className="mb-4 grid gap-2 text-xs font-bold text-foreground"
        >
          <div className="flex items-center justify-between gap-3">
            <span id="preferred-days-label">Preferred days</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-[11px]"
                disabled={weekdays.every((day) => field.value.includes(day))}
                onBlur={field.onBlur}
                onClick={() => field.onChange([...weekdays])}
              >
                Select all
              </Button>
              <span aria-hidden="true" className="font-normal text-muted-foreground">|</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-[11px]"
                disabled={field.value.length === 0}
                onBlur={field.onBlur}
                onClick={() => field.onChange([])}
              >
                Clear all
              </Button>
            </div>
          </div>
          <p id="preferred-days-help" className="m-0 font-normal text-muted-foreground">
            Prefer these days. Leave blank for any day.
          </p>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((day, index) => (
              <Button
                key={day}
                type="button"
                size="sm"
                variant={field.value.includes(day) ? "secondary" : "outline"}
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
