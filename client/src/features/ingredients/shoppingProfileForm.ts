import type {
  IngredientShoppingProfile,
  IngredientShoppingProfilePayload,
  UnitOption,
} from "../../types";

export type ShoppingDraft = {
  how: "piece" | "bulk" | "package";
  bulkUnit: string;
  pieceWeight: string;
  packageUnit: string;
  packageSize: string;
  packageMeasure: "g" | "ml";
};

const BULK_UNITS = new Set(["g", "kg", "ml", "l"]);
const MEASURE_UNITS = new Set(["g", "ml"]);
const PACKAGE_UNITS = new Set([
  "frasco",
  "bag",
  "can",
  "bottle",
  "package",
  "bolsa",
  "paquete",
  "lata",
  "botella",
]);

export function shoppingProfileToDraft(profile: IngredientShoppingProfile | null): ShoppingDraft {
  const unit = profile?.shopping_unit ?? "pieza";
  let how: ShoppingDraft["how"] = "package";
  if (unit === "pieza") how = "piece";
  else if (BULK_UNITS.has(unit)) how = "bulk";

  const piece =
    profile?.base_unit === "g"
      ? profile.equivalences.find((entry) => entry.unit === "pieza")
      : undefined;
  const pack = profile?.equivalences.find((entry) => entry.unit === unit);
  return {
    how,
    bulkUnit: how === "bulk" ? unit : "kg",
    pieceWeight: piece?.quantity ?? "",
    packageUnit: how === "package" ? unit : "",
    packageSize: pack?.quantity ?? "",
    packageMeasure: profile?.base_unit === "ml" ? "ml" : "g",
  };
}

export function validShoppingAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0.000001 && amount <= 1_000_000_000;
}

export function shoppingUnitOptions(
  units: UnitOption[],
  profile: IngredientShoppingProfile | null,
) {
  const current = shoppingProfileToDraft(profile);
  return {
    packages: units.filter(
      (unit) =>
        PACKAGE_UNITS.has(unit.code) ||
        (current.how === "package" && unit.code === current.packageUnit),
    ),
    bulk: units.filter((unit) => BULK_UNITS.has(unit.code)),
    measures: units.filter((unit) => MEASURE_UNITS.has(unit.code)),
  };
}

type Measurement = Omit<IngredientShoppingProfilePayload["equivalences"][number], "unit">;
type Selection = { unit: string; base: string; measurement?: Measurement };

function selectionForDraft(draft: ShoppingDraft): Selection {
  switch (draft.how) {
    case "piece":
      return {
        unit: "pieza",
        base: "g",
        measurement: {
          quantity: draft.pieceWeight,
          source: "User-entered approximate piece weight",
          description: "Approximate weight of one piece",
          approximate: true,
        },
      };
    case "bulk":
      return { unit: draft.bulkUnit, base: ["g", "kg"].includes(draft.bulkUnit) ? "g" : "ml" };
    case "package":
      return {
        unit: draft.packageUnit,
        base: draft.packageMeasure,
        measurement: {
          quantity: draft.packageSize,
          source: "User-entered package size",
          description: "Contents of the package normally purchased",
          approximate: false,
        },
      };
  }
}

type ProfileResult =
  | { ok: true; payload: IngredientShoppingProfilePayload }
  | { ok: false; reason: "incompatible_measurements" };

export function shoppingDraftToProfile(
  draft: ShoppingDraft,
  profile: IngredientShoppingProfile | null,
): ProfileResult {
  const selection = selectionForDraft(draft);
  const extras = profile?.equivalences.filter((entry) => entry.unit !== selection.unit) ?? [];
  if (profile && profile.base_unit !== selection.base && extras.length) {
    return { ok: false, reason: "incompatible_measurements" };
  }

  const equivalences = profile?.base_unit === selection.base ? [...extras] : [];
  const entered = selection.measurement;
  if (entered) {
    const existing =
      profile?.base_unit === selection.base
        ? profile.equivalences.find((entry) => entry.unit === selection.unit)
        : undefined;
    if (existing && Number(existing.quantity) === Number(entered.quantity)) {
      equivalences.push(existing);
    } else {
      equivalences.push({
        unit: selection.unit,
        ...entered,
        description: existing?.description || entered.description,
        approximate: entered.approximate || existing?.approximate === true,
      });
    }
  }

  const roundUp =
    profile && selection.unit === profile.shopping_unit ? profile.round_up : draft.how !== "bulk";
  return {
    ok: true,
    payload: {
      base_unit: selection.base,
      shopping_unit: selection.unit,
      round_up: roundUp,
      equivalences,
    },
  };
}
