import { memo, useEffect, useRef, useState } from "react";
function QuantityEditor({
  name,
  value,
  onChange,
  compact = false,
}: {
  name: string;
  value: number;
  onChange: (quantity: number) => void;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(String(value)),
    [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    cancelled = useRef(false);
  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value]);
  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);
  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const next = Number(draft);
    if (!draft.trim() || !Number.isInteger(next) || next < 1 || next > 10000) {
      setInvalid(true);
      return;
    }
    if (next !== value) onChange(next);
    setEditing(false);
    setInvalid(false);
  };
  if (!editing)
    return (
      <button
        className={compact ? "tree-quantity" : "quantity-cell"}
        title={`Alterar quantidade de ${name}`}
        aria-label={`Alterar quantidade de ${name}`}
        onClick={() => {
          cancelled.current = false;
          setEditing(true);
        }}
      >
        {compact ? "×" : ""}
        {value}
      </button>
    );
  return (
    <span className={`quantity-edit ${compact ? "compact" : ""}`}>
      <input
        ref={input}
        type="number"
        min={1}
        max={10000}
        step={1}
        aria-label={`Quantidade de ${name}`}
        aria-invalid={invalid}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            cancelled.current = true;
            setDraft(String(value));
            setEditing(false);
            setInvalid(false);
          }
        }}
      />
      {invalid && <span role="alert">Use um inteiro de 1 a 10000.</span>}
    </span>
  );
}
export default memo(QuantityEditor);
