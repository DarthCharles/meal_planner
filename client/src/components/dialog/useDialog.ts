import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type DialogText = string | (() => string);

export type DialogOptions = {
  title: DialogText;
  hideTitle?: boolean;
  eyebrow?: DialogText;
  content: (controls: { close: () => void }) => ReactNode;
};

export type DialogInstance = DialogOptions & {
  id: number;
  close: () => void;
  opener: HTMLElement | null;
};

export const DialogContext = createContext<{
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
} | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context)
    throw new Error("useDialog must be used within DialogProvider.");
  return context;
}
