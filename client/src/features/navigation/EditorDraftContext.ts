import { createContext, useContext, useEffect, useId } from "react";

export const EditorDraftContext = createContext<((id: string, dirty: boolean) => void) | null>(
  null,
);

export function useEditorDraft(dirty: boolean) {
  const register = useContext(EditorDraftContext);
  const id = useId();
  useEffect(() => {
    register?.(id, dirty);
    return () => register?.(id, false);
  }, [register, id, dirty]);
}
