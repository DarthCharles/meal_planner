import { useSyncExternalStore } from "react";
import { en } from "./en";
import { es } from "./es";

export type Locale = "en" | "es";
type TranslationTree = { [key: string]: string | TranslationTree };
type Keys<T> = {
  [K in keyof T & string]: T[K] extends string ? K
    : T[K] extends { one: string; other: string } ? K
    : `${K}.${Keys<T[K]>}`;
}[keyof T & string];
export type TranslationKey = Keys<typeof en>;
const catalogs = { en, es };

function lookup(catalog: TranslationTree, key: string): string | TranslationTree | undefined {
  let value: string | TranslationTree | undefined = catalog;
  for (const part of key.split(".")) {
    if (!value || typeof value === "string" || !Object.prototype.hasOwnProperty.call(value, part)) return;
    value = value[part];
  }
  return value;
}
export type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;
const storageKey = "comal.locale";
const listeners = new Set<() => void>();

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "en" || saved === "es") return saved;
  } catch { /* Language selection also works when storage is unavailable. */ }
  for (const language of navigator.languages ?? [navigator.language]) {
    const code = language.toLowerCase().split("-")[0];
    if (code === "en" || code === "es") return code;
  }
  return "en";
}

let locale = initialLocale();
export const getLocale = () => locale;
export const formatLocale = () => locale === "es" ? "es-MX" : "en-US";

export const t: Translate = (key, values = {}) => {
  const category = typeof values.count === "number"
    ? new Intl.PluralRules(formatLocale()).select(values.count)
    : undefined;
  const translated = lookup(catalogs[locale], key) ?? lookup(catalogs.en, key);
  const plural = category && typeof translated === "object"
    ? translated[category] ?? translated.other
    : undefined;
  const message = typeof translated === "string" ? translated
    : typeof plural === "string" ? plural
    : `translation missing: ${locale}.${key}`;
  return message.replace(/%\{(\w+)\}/g, (placeholder, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return placeholder;
    const value = values[name];
    return typeof value === "number" ? new Intl.NumberFormat(formatLocale()).format(value) : value;
  });
};

export function unitLabel(code: string) {
  const key = `reference.units.${code}`;
  return lookup(catalogs.en, key) ? t(key as TranslationKey) : code;
}

function updateDocument() {
  document.documentElement.lang = locale;
  document.title = t("app.title");
  document.querySelector('link[rel="manifest"]')?.setAttribute("href", locale === "es" ? "/manifest.es.webmanifest" : "/manifest.webmanifest");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.description"));
}

function applyLocale(next: Locale) {
  if (locale === next) return;
  locale = next;
  updateDocument();
  listeners.forEach((listener) => listener());
}

export function setLocale(next: Locale) {
  try { localStorage.setItem(storageKey, next); } catch { /* Keep the in-memory preference. */ }
  applyLocale(next);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useI18n() {
  const currentLocale = useSyncExternalStore(subscribe, getLocale);
  return { locale: currentLocale, setLocale, t };
}

window.addEventListener("storage", (event) => {
  if (event.key !== storageKey || event.storageArea !== localStorage) return;
  // Read the latest preference: a background tab may receive older queued events.
  // Applying a remote change must never persist it and echo it back to other tabs.
  const saved = localStorage.getItem(storageKey);
  if (saved === "en" || saved === "es") applyLocale(saved);
});
updateDocument();
