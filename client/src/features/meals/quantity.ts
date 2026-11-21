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
export function validQuantity(value: string) {
  const text = value.trim();
  let amount: number;
  const glyph = text.match(/^(\d*)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  const fraction = text.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (glyph) amount = Number(glyph[1] || 0) + fractions[glyph[2]];
  else if (fraction) amount = Number(fraction[1] || 0) + Number(fraction[2]) / Number(fraction[3]);
  else if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) amount = Number(text);
  else return false;
  return Number.isFinite(amount) && Math.round(amount * 1e6) > 0 && amount <= 1e9;
}
