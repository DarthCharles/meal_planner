import { formatLocale } from "../../i18n";

// Validate capture without rewriting the user's measured quantity before Rails saves it.
const fractions: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅕": 1 / 5,
  "⅖": 2 / 5,
  "⅗": 3 / 5,
  "⅘": 4 / 5,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};
export function parseQuantity(value: string) {
  const text = value.trim();
  const glyph = text.match(/^(\d*)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  const fraction = text.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (glyph) return Number(glyph[1] || 0) + fractions[glyph[2]];
  if (fraction) return Number(fraction[1] || 0) + Number(fraction[2]) / Number(fraction[3]);
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN;
}

export function validQuantity(value: string) {
  const amount = parseQuantity(value);
  return Number.isFinite(amount) && Math.round(amount * 1e6) > 0 && amount <= 1e9;
}

const culinaryUnits = new Set([
  "piece",
  "cup",
  "teaspoon",
  "tablespoon",
  "jar",
  "bag",
  "can",
  "bottle",
  "package",
]);

function commonRecipeFraction(amount: number, unit: string) {
  if (!culinaryUnits.has(unit)) return undefined;
  const whole = Math.floor(amount);
  const fraction = Object.entries(fractions).find(
    ([, size]) => Math.abs(amount - whole - size) <= 0.0000005,
  );
  return fraction ? `${whole || ""}${fraction[0]}` : undefined;
}

export function recipeQuantityDraft(value: number | string, unit: string) {
  const text = String(value);
  return commonRecipeFraction(parseQuantity(text), unit) ?? text;
}

export function formatRecipeQuantity(value: number | string, unit: string) {
  const amount = parseQuantity(String(value));
  return (
    commonRecipeFraction(amount, unit) ??
    new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 6 }).format(amount)
  );
}
