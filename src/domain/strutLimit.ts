import type { DesignSettings, StrutLimit } from "./design";

type Criterion = {
  label: string;
  formula: string;
  reference: string;
  loadType?: DesignSettings["loadType"];
};
const pending =
  "referência indicada no repositório; conferência no texto normativo pendente";
export const strutLimitCriteria: Record<StrutLimit, Criterion> = {
  fcd2: {
    label: "Padrão conservador · fcd2",
    formula: "mín(0,60·αv2·fcd; β·fcd)",
    reference: "Política conservadora LC-ELU-2026.2",
  },
  fcd3: {
    label: "0,72·αv2·fcd · fcd3",
    formula: "0,72·αv2·fcd",
    reference: `NBR 6118 §22.3.2 (${pending})`,
  },
  indirect085: {
    label: "0,85·fcd · carga indireta",
    formula: "0,85·fcd",
    reference: `NBR 9062:2017 §7.3.4.1, alínea b (${pending})`,
    loadType: "indirect",
  },
  direct100: {
    label: "fcd · carga direta",
    formula: "fcd",
    reference: `NBR 9062:2017 §7.3.4.1, alínea a (${pending})`,
    loadType: "direct",
  },
};
export function strutLimitAllowed(
  criterion: StrutLimit,
  loadType: DesignSettings["loadType"],
) {
  const required = strutLimitCriteria[criterion].loadType;
  return !required || required === loadType;
}
// Material values are supplied by materialProperties; this choice does not change them.
export function strutLimitValue(
  criterion: StrutLimit,
  loadType: DesignSettings["loadType"],
  material: { fcd: number; fcd2: number; fcd3: number },
) {
  switch (criterion) {
    case "fcd2":
      return Math.min(
        material.fcd2,
        (loadType === "direct" ? 1 : 0.85) * material.fcd,
      );
    case "fcd3":
      return material.fcd3;
    case "indirect085":
      return 0.85 * material.fcd;
    case "direct100":
      return material.fcd;
  }
}
