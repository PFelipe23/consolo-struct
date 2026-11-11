import { useId, useMemo } from "react";
import type { Piece } from "../domain/model";
import { number } from "../domain/model";
import {
  beamArrangementAvailable,
  beamLayout,
  type BeamEnd,
} from "../detailing/beam";
import type { DetailingSettings } from "../detailing/settings";
import { NumericField } from "./NumericField";

export type BarArrangementPatch = Partial<
  Pick<
    DetailingSettings,
    "barArrangement" | "beamBottomCount" | "beamBottomDiameter"
  >
>;
const cm = (mm: number) => number(mm / 10, 1);
const ends = (back: BeamEnd, front: BeamEnd) =>
  `suporte ${cm(back.leg)} cm · ponta ${cm(front.leg)} cm`;

export default function BarArrangementControl({
  piece,
  onChange,
}: {
  piece: Piece;
  onChange: (patch: BarArrangementPatch) => void;
}) {
  const id = useId();
  const available = beamArrangementAvailable(piece);
  const selected = piece.detailing.barArrangement;
  const active = selected === "beam" && available;
  const layout = useMemo(
    () => (active ? beamLayout(piece) : null),
    [active, piece],
  );
  const fits =
    layout &&
    layout.top.every((b) => b.back.fits && b.front.fits) &&
    layout.bottom.back.fits &&
    layout.bottom.front.fits;
  return (
    <section
      className="bar-arrangement-control"
      aria-label="Modo de detalhamento das armaduras"
    >
      <fieldset className="arrangement-options">
        <legend className="field-label">Modo de detalhamento</legend>
        <label>
          <input
            type="radio"
            name={`${id}-arrangement`}
            value="consolo"
            checked={!active}
            onChange={() => onChange({ barArrangement: "consolo" })}
          />{" "}
          Consolo (alça ou barra transversal soldada, conforme o cálculo)
        </label>
        <label>
          <input
            type="radio"
            name={`${id}-arrangement`}
            value="beam"
            checked={active}
            disabled={!available}
            aria-describedby={`${id}-help`}
            onChange={() => onChange({ barArrangement: "beam" })}
          />{" "}
          Armado como viga
        </label>
      </fieldset>
      <p id={`${id}-help`}>
        {available
          ? "Tirante (negativa) com barras superiores e armadura positiva com barras inferiores, ambas com dobras de 90° no suporte e na ponta. As dobras respeitam o contorno e os cobrimentos e são dimensionadas para o comprimento de ancoragem necessário."
          : "Disponível somente quando o concreto excedente (região dispensável) do consolo é mantido. Com o recorte, a peça usa o modo de consolo."}
      </p>
      {selected === "beam" && !available && (
        <p className="strut-limit-warning" role="alert">
          O modo “Armado como viga” está salvo nesta peça, mas não é aplicado
          enquanto o concreto excedente for recortado.
        </p>
      )}
      {active && layout && (
        <>
          <NumericField
            label="Barras da armadura positiva"
            unit="barras"
            min={2}
            max={20}
            value={piece.detailing.beamBottomCount}
            onChange={(v) => onChange({ beamBottomCount: v })}
          />
          <NumericField
            label="Bitola da armadura positiva"
            unit="mm"
            min={5}
            max={25}
            step={0.1}
            value={piece.detailing.beamBottomDiameter}
            onChange={(v) => onChange({ beamBottomDiameter: v })}
          />
          <p>
            <strong>Dobras do tirante</strong> (lb,nec = {cm(layout.lbNecTop)}{" "}
            cm): {ends(layout.top[0].back, layout.top[0].front)}
            <br />
            <strong>Dobras da positiva</strong> (lb,nec ={" "}
            {cm(layout.lbNecBottom)} cm):{" "}
            {ends(layout.bottom.back, layout.bottom.front)}
          </p>
          {!fits && (
            <p className="strut-limit-warning" role="alert">
              Alguma dobra não alcança a ancoragem necessária dentro do
              contorno. Veja as pendências do detalhamento.
            </p>
          )}
          <p className="strut-limit-warning">
            Muda só o detalhamento. O cálculo por bielas e tirantes não muda, a
            armadura positiva não entra como armadura resistente e a ancoragem
            frontal por dobra exige conferência do responsável técnico.
          </p>
        </>
      )}
    </section>
  );
}
