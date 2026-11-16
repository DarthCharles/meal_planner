import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import { DialogHost } from "./DialogHost";
import type { DialogInstance, DialogOptions } from "./useDialog";
import { DialogContext } from "./useDialog";

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogInstance | null>(null);
  const nextId = useRef(0);
  const closeDialog = useCallback(() => setDialog(null), []);
  const openDialog = useCallback((options: DialogOptions) => {
    const id = ++nextId.current;
    const focusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Feature callbacks can only close the instance that created them.
    const close = () => setDialog((current) => (current?.id === id ? null : current));
    setDialog((current) => ({
      ...options,
      id,
      close,
      opener: current?.opener ?? focusedElement,
    }));
  }, []);
  const actions = useMemo(() => ({ openDialog, closeDialog }), [openDialog, closeDialog]);

  return (
    <DialogContext.Provider value={actions}>
      {children}
      {dialog && <DialogHost key={dialog.id} dialog={dialog} />}
    </DialogContext.Provider>
  );
}
