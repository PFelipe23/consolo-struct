// Reference pairs supplied by issue #2; production never changes adopted factors.
export const materialSafetyReferences = {
  precast: { label: "Pré-moldado", gammaC: 1.4, gammaS: 1.15 },
  factory: {
    label: "Pré-fabricado (controle de fábrica)",
    gammaC: 1.3,
    gammaS: 1.1,
  },
  cast: { label: "Moldado no local", gammaC: 1.4, gammaS: 1.15 },
} as const;
export type Production = keyof typeof materialSafetyReferences;
export const coefficientText = (value: number) =>
  value.toLocaleString("pt-BR", {
    useGrouping: false,
    maximumFractionDigits: 8,
  });
export function materialSafety(design: {
  production: Production;
  gammaC?: number;
  gammaS?: number;
}) {
  const gammaC = design.gammaC ?? 1.4;
  const gammaS = design.gammaS ?? 1.15;
  const reference = materialSafetyReferences[design.production];
  const below = [
    ...(gammaC < reference.gammaC
      ? [{ symbol: "γc", adopted: gammaC, reference: reference.gammaC }]
      : []),
    ...(gammaS < reference.gammaS
      ? [{ symbol: "γs", adopted: gammaS, reference: reference.gammaS }]
      : []),
  ];
  return { gammaC, gammaS, reference, below };
}
export const materialSafetyReference =
  "NBR 9062:2017 §8.1; NBR 6118:2026 (referências informadas no repositório)";
