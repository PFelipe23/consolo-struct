import { NumericField } from "./NumericField";
import type { DesignSettings } from "../domain/design";
import type { Piece } from "../domain/model";
import {
  coefficientText,
  materialSafety,
  materialSafetyReferences,
  type Production,
} from "../domain/materialSafety";

export type MaterialSafetyPatch = Partial<
  Pick<DesignSettings, "production" | "gammaC" | "gammaS">
>;
export default function MaterialSafetyControl({
  piece,
  onChange,
}: {
  piece: Piece;
  onChange: (patch: MaterialSafetyPatch) => void;
}) {
  const safety = materialSafety(piece.design);
  return (
    <section
      className="material-safety-control"
      aria-label="Coeficientes dos materiais da peça"
    >
      <label className="field">
        <span className="field-label">Processo de produção</span>
        <select
          value={piece.design.production}
          onChange={(event) =>
            onChange({ production: event.target.value as Production })
          }
        >
          {Object.entries(materialSafetyReferences).map(([id, reference]) => (
            <option key={id} value={id}>
              {reference.label}
            </option>
          ))}
        </select>
      </label>
      <div className="fields-grid">
        <NumericField
          label="Coeficiente do concreto γc"
          unit=""
          value={safety.gammaC}
          min={1}
          max={2}
          step={0.05}
          onChange={(gammaC) => onChange({ gammaC })}
        />
        <NumericField
          label="Coeficiente do aço γs"
          unit=""
          value={safety.gammaS}
          min={1}
          max={2}
          step={0.05}
          onChange={(gammaS) => onChange({ gammaS })}
        />
      </div>
      <p>
        Adotados: γc = {coefficientText(safety.gammaC)} · γs ={" "}
        {coefficientText(safety.gammaS)}.
      </p>
      <p>
        Par de referência para {safety.reference.label}: γc ={" "}
        {coefficientText(safety.reference.gammaC)} · γs ={" "}
        {coefficientText(safety.reference.gammaS)}.
      </p>
      {!!safety.below.length && (
        <div className="material-safety-warning" role="note">
          <strong>Conferência complementar necessária</strong>
          <ul>
            {safety.below.map((value) => (
              <li key={value.symbol}>
                {value.symbol} adotado {coefficientText(value.adopted)}, abaixo
                da referência {coefficientText(value.reference)}.
              </li>
            ))}
          </ul>
        </div>
      )}
      <small>
        Critérios da peça {piece.name}. Mudar o processo de produção não muda os
        coeficientes automaticamente. A adoção de valores reduzidos é uma
        decisão explícita do responsável técnico; o programa não certifica o
        enquadramento do elemento. Pares informados no repositório, com
        referência à NBR 9062:2017 §8.1 e à NBR 6118:2026.
      </small>
    </section>
  );
}
