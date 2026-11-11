import { useId } from "react";
import type { ExcessConcrete } from "../domain/design";
import { number, type Piece } from "../domain/model";
import {
  concreteProfile,
  excessConcreteLabels,
  pieceVolume,
} from "../domain/profile";

const options: { value: ExcessConcrete; label: string; help: string }[] = [
  {
    value: "keep",
    label: "Manter concreto excedente",
    help: "Preserva a geometria original do consolo.",
  },
  {
    value: "remove",
    label: "Remover concreto excedente",
    help: "Recorta a região abaixo da biela que não participa da transferência dos esforços.",
  },
];

export default function ExcessConcreteControl({
  piece,
  onChange,
}: {
  piece: Piece;
  onChange: (value: ExcessConcrete) => void;
}) {
  const id = useId();
  const selected = piece.design.excessConcrete ?? "keep";
  const profile = concreteProfile({
    ...piece,
    design: { ...piece.design, excessConcrete: "remove" },
  });
  const original = concreteProfile({
    ...piece,
    design: { ...piece.design, excessConcrete: "keep" },
  });
  const removable = profile.status === "removed";
  return (
    <section
      className="strut-limit-control excess-concrete-control"
      aria-label="Concreto excedente da peça"
    >
      <fieldset aria-describedby={`${id}-help`}>
        <legend className="field-label">Concreto excedente</legend>
        {options.map((o) => (
          <label key={o.value} className="excess-concrete-option">
            <input
              type="radio"
              name={`${id}-excess`}
              value={o.value}
              checked={selected === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>
              <strong>{o.label}</strong>
              <br />
              <small>{o.help}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <p>
        <strong>
          {selected === "keep"
            ? excessConcreteLabels.kept
            : excessConcreteLabels[profile.status]}
        </strong>
        <br />
        {removable
          ? `Volume dispensável: ${number(pieceVolume(piece, original) - pieceVolume(piece, profile), 4)} m³ por peça (${number(profile.removedRatio * 100, 1)}% do volume original de ${number(pieceVolume(piece, original), 4)} m³).`
          : "Nenhum recorte disponível para a geometria e o modelo atuais."}
      </p>
      <p id={`${id}-help`}>
        Opção da peça {piece.name}, salva no projeto. O recorte segue a face
        inferior da biela do modelo de bielas e tirantes e mantém a altura h na
        face do suporte, a altura h₂ na ponta, o tirante, as ancoragens e as
        demais configurações. Não se aplica a atrito-cisalhamento nem a viga em
        balanço.
      </p>
      {selected === "remove" && removable && (
        <p className="strut-limit-warning">
          A forma recortada gera nota “Conferir” na memória de cálculo e exige
          avaliação do responsável técnico.
        </p>
      )}
    </section>
  );
}
