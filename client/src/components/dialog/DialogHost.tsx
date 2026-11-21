import { useId, useLayoutEffect, useRef } from "react";

import { Button } from "@darthcharles/greda";
import { X } from "@darthcharles/greda/icons";

import { useI18n } from "../../i18n";
import type { DialogInstance } from "./useDialog";

export function DialogHost({
  dialog,
  lockScroll = true,
}: {
  dialog: DialogInstance;
  lockScroll?: boolean;
}) {
  const { t } = useI18n();
  const elementRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pointerStartedOutside = useRef(false);
  const titleId = useId();
  const { title, hideTitle, eyebrow, content, close, opener } = dialog;
  const dismiss = () => {
    close();
    dialog.onDismiss?.();
  };
  const titleText = typeof title === "function" ? title() : title;
  const eyebrowText = typeof eyebrow === "function" ? eyebrow() : eyebrow;

  useLayoutEffect(() => {
    const element = elementRef.current!;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    if (lockScroll) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    element.showModal();
    // A stable title also works while feature content is still loading.
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      if (lockScroll) {
        document.body.style.overflow = bodyOverflow;
        document.documentElement.style.overflow = rootOverflow;
      }
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [opener, lockScroll]);

  return (
    <dialog
      ref={elementRef}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 m-0 h-full w-full max-h-none max-w-none items-end justify-items-center overflow-hidden border-0 bg-transparent p-[15px] text-foreground open:grid desktop:items-center backdrop:bg-overlay"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]",
          ),
        ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === titleRef.current)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) close();
      }}
      onPointerDown={(event) => {
        pointerStartedOutside.current = event.target === event.currentTarget;
      }}
      onPointerCancel={() => {
        pointerStartedOutside.current = false;
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && pointerStartedOutside.current) dismiss();
        pointerStartedOutside.current = false;
      }}
    >
      <section className="max-h-[calc(100dvh-30px)] w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-[24px_24px_15px_15px] bg-card p-[25px] shadow-lg desktop:rounded-3xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {eyebrowText && (
              <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
                {eyebrowText}
              </p>
            )}
            <h2
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className={
                hideTitle
                  ? "sr-only"
                  : "mb-0 break-words font-display text-[27px] font-semibold leading-tight tracking-[-.04em] outline-none"
              }
            >
              {titleText}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            onClick={dismiss}
            aria-label={t("common.close")}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        {content({ close })}
      </section>
    </dialog>
  );
}
