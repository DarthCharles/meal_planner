import { Button } from "@darthcharles/greda";
import { Controller, useFormContext } from "react-hook-form";
import type { MealForm, Weekday } from "../../types";
import { dayLabel, sameDays, weekdays, weekend, workweek } from "./preferredDays";

const presets: { label: string; days: Weekday[] }[] = [
  { label: "Any day", days: [] },
  { label: "Weekdays (Mon–Thu)", days: workweek },
  { label: "Weekend (Fri–Sun)", days: weekend },
];

export function PreferredDaysField() {
  const { control } = useFormContext<MealForm>();
  return (
    <fieldset className="mb-4 grid gap-2 text-xs font-bold text-foreground">
      <legend className="mb-2">Preferred days</legend>
      <p id="preferred-days-help" className="m-0 font-normal text-muted-foreground">
        Favor these days when planning. Other days are a fallback if needed.
      </p>
      <Controller
        name="preferred_days"
        control={control}
        render={({ field }) => (
          <>
            <div className="flex flex-wrap gap-2">
              {presets.map(({ label, days }, index) => (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant={sameDays(field.value, days) ? "secondary" : "outline"}
                  aria-pressed={sameDays(field.value, days)}
                  aria-describedby="preferred-days-help"
                  ref={index === 0 ? field.ref : undefined}
                  onBlur={field.onBlur}
                  onClick={() => field.onChange(days)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <span className="mt-1">Choose days</span>
            <div className="flex flex-wrap gap-2">
              {weekdays.map((day) => (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={field.value.includes(day) ? "secondary" : "outline"}
                  aria-pressed={field.value.includes(day)}
                  aria-describedby="preferred-days-help"
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
          </>
        )}
      />
    </fieldset>
  );
}
