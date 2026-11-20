import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import { DialogHost } from "./DialogHost";
import type { DialogInstance, DialogOptions } from "./useDialog";
import { DialogContext } from "./useDialog";

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogInstance[]>([]);
  const nextId = useRef(0);
  const closeDialog = useCallback(() => setDialogs((current) => current.slice(0, -1)), []);
  const showDialog = useCallback((options: DialogOptions, push: boolean) => {
    const id = ++nextId.current;
    const focusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Async callbacks can close only the active instance that created them.
    const close = () =>
      setDialogs((current) =>
        current[current.length - 1]?.id === id ? current.slice(0, -1) : current,
      );
    setDialogs((current) => {
      const instance = {
        ...options,
        id,
        close,
        opener: push ? focusedElement : (current[0]?.opener ?? focusedElement),
      };
      return push ? [...current, instance] : [instance];
    });
  }, []);
  const openDialog = useCallback(
    (options: DialogOptions) => showDialog(options, false),
    [showDialog],
  );
  const pushDialog = useCallback(
    (options: DialogOptions) => showDialog(options, true),
    [showDialog],
  );
  const actions = useMemo(
    () => ({ openDialog, pushDialog, closeDialog }),
    [openDialog, pushDialog, closeDialog],
  );
  return (
    <DialogContext.Provider value={actions}>
      {children}
      {dialogs.map((dialog, index) => (
        <DialogHost key={dialog.id} dialog={dialog} lockScroll={index === 0} />
      ))}
    </DialogContext.Provider>
  );
}
