import { useEffect, useState, useId, useRef } from "react";
import { number } from "../domain/model";
const inputFormatter = new Intl.NumberFormat("pt-BR", {
  useGrouping: false,
  maximumFractionDigits: 8,
});
const inputNumber = (value: number) => inputFormatter.format(value);
export function NumericField({
  label,
  symbol,
  value,
  unit,
  factor = 1,
  min = 0,
  max = 6000,
  step = 1,
  onChange,
  onFocus,
}: {
  label: string;
  symbol?: string;
  value: number;
  unit: string;
  factor?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  onFocus?: () => void;
}) {
  const [draft, setDraft] = useState(() => inputNumber(value / factor));
  const cancelled = useRef(false);
  const [error, setError] = useState(false);
  const id = useId();
  useEffect(() => {
    setDraft(inputNumber(value / factor));
    setError(false);
  }, [value, factor]);
  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const normalized = draft.trim().replace(/\s/g, "").replace(",", ".");
    const n = Number(normalized);
    if (
      !normalized ||
      !Number.isFinite(n) ||
      n * factor < min ||
      n * factor > max ||
      (step === 1 &&
        factor === 1 &&
        ["barras", "ramos", "estribos", "camadas"].includes(unit) &&
        !Number.isInteger(n))
    ) {
      setError(true);
      return;
    }
    setError(false);
    onChange(n * factor);
  };
  return (
    <label className={`field ${error ? "field-error" : ""}`} htmlFor={id}>
      <span className="field-label">
        {label}
        {symbol && <i>{symbol}</i>}
      </span>
      <span className="input-wrap">
        <input
          id={id}
          inputMode="decimal"
          value={draft}
          aria-invalid={error}
          onFocus={onFocus}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(false);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              cancelled.current = true;
              setDraft(inputNumber(value / factor));
              setError(false);
              e.currentTarget.blur();
            }
          }}
        />
        <span>{unit}</span>
      </span>
      {error && (
        <small role="alert">
          Informe {number(min / factor, 0)} a {number(max / factor, 0)} {unit}.
        </small>
      )}
    </label>
  );
}
