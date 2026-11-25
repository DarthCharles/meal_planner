import { useId } from "react";

import { Button } from "@darthcharles/greda";
import { ChevronRight } from "@darthcharles/greda/icons";

export function CollectionRow({
  name,
  description,
  onOpen,
}: {
  name: string;
  description?: string;
  onOpen: () => void;
}) {
  const nameId = useId();
  const descriptionId = useId();

  return (
    <li className="surface-raised border-t border-border first:rounded-t-xl first:border-t-0 last:rounded-b-xl">
      <Button
        type="button"
        variant="ghost"
        aria-labelledby={nameId}
        aria-describedby={description ? descriptionId : undefined}
        className="flex h-auto min-h-11 w-full min-w-0 items-center justify-between gap-sm rounded-[inherit] px-sm py-sm text-left whitespace-normal"
        onClick={onOpen}
      >
        <span className="grid min-w-0 gap-2xs">
          <span id={nameId} className="text-body font-medium wrap-anywhere">
            {name}
          </span>
          {description && (
            <span
              id={descriptionId}
              className="text-caption font-normal wrap-anywhere text-muted-foreground"
            >
              {description}
            </span>
          )}
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </Button>
    </li>
  );
}
