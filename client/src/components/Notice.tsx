import type { ReactNode } from "react";

import { Info } from "@darthcharles/greda/icons";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-xs rounded-[10px] bg-muted px-sm py-sm text-xs text-foreground"
    >
      <Info aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </div>
  );
}
