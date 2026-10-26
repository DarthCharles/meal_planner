import type { ReactNode } from "react";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-[9px] rounded-[10px] bg-[#f7eed1] px-[13px] py-[11px] text-xs text-[#806638]"
    >
      <span
        aria-hidden="true"
        className="grid size-[17px] place-items-center rounded-full border border-current text-[11px]"
      >
        i
      </span>
      {children}
    </div>
  );
}
