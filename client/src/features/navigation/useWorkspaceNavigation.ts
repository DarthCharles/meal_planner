import { useCallback } from "react";

import type { Location } from "react-router";
import { useLocation, useNavigate } from "react-router";

export function isEditorPath(pathname: string) {
  return /^\/(meals|ingredients)\/(new|[1-9]\d*\/edit)$/.test(pathname);
}

export function editorBackground(location: Location): Location | undefined {
  const origin = location.state?.editorOrigin as Location | undefined;
  return isEditorPath(location.pathname) &&
    origin?.pathname?.startsWith("/") &&
    !isEditorPath(origin.pathname)
    ? origin
    : undefined;
}

export function useWorkspaceNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const openEditor = useCallback(
    (path: string) => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.setAttribute("data-editor-return", location.key);
      navigate(path, {
        state: {
          editorOrigin: editorBackground(location) ?? location,
          scrollY: window.scrollY,
          returnFocusKey: location.key,
        },
      });
    },
    [location, navigate],
  );
  const finishEditor = useCallback(() => {
    if (editorBackground(location)) navigate(-1);
    else
      navigate(location.pathname.startsWith("/ingredients") ? "/ingredients" : "/meals", {
        replace: true,
      });
  }, [location, navigate]);
  const preview = useCallback(
    (values: { ingredient?: number; meal?: number; name?: string }) => {
      const params = new URLSearchParams(location.search);
      for (const key of ["ingredient", "meal", "previewName"]) params.delete(key);
      if (!values.ingredient) params.delete("ingredientName");
      if (values.ingredient) params.set("ingredient", String(values.ingredient));
      if (values.ingredient && !values.meal && values.name)
        params.set("ingredientName", values.name);
      if (values.meal) params.set("meal", String(values.meal));
      if (values.name) params.set("previewName", values.name);
      navigate(
        { pathname: location.pathname, search: params.toString() },
        {
          state: { ...location.state, previewParent: location.key },
          preventScrollReset: true,
        },
      );
    },
    [location, navigate],
  );
  return { openEditor, finishEditor, preview };
}
