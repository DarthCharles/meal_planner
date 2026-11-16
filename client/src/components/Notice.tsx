import type { ReactNode } from "react";

import { Info } from "@darthcharles/greda/icons";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-[9px] rounded-[10px] bg-muted px-[13px] py-[11px] text-xs text-foreground"
    >
      <Info aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </div>
  );
}
