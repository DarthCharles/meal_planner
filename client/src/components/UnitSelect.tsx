import { useId, useState } from "react";

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@darthcharles/greda";

import { unitLabel } from "../i18n";
import type { UnitOption } from "../types";

export function UnitSelect({
  label,
  value,
  onChange,
  units,
  disabled,
  invalid,
  describedBy,
  inputRef,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  units: UnitOption[];
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: (instance: HTMLButtonElement | null) => void;
  onBlur?: () => void;
}) {
  const id = useId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setContainer} className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          type="button"
          ref={inputRef}
          onBlur={onBlur}
          className="h-11 w-full min-w-0"
          aria-invalid={invalid}
          aria-describedby={describedBy}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent container={container}>
          {units.map((unit) => (
            <SelectItem key={unit.code} value={unit.code}>
              {unitLabel(unit.code)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
