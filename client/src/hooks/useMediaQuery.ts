import { useMemo, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const { subscribe, getSnapshot } = useMemo(() => {
    const mediaQuery = window.matchMedia(query);

    return {
      subscribe(onChange: () => void) {
        mediaQuery.addEventListener("change", onChange);
        return () => mediaQuery.removeEventListener("change", onChange);
      },
      getSnapshot: () => mediaQuery.matches,
    };
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
