import { useRef } from "react";
export default function PanelResizer({
  label,
  value,
  min,
  max,
  reverse = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  reverse?: boolean;
  onChange: (value: number) => void;
}) {
  const start = useRef<{ x: number; value: number } | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div
      className="panel-resizer"
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, value };
      }}
      onPointerMove={(e) => {
        if (start.current)
          onChange(
            clamp(
              start.current.value +
                (e.clientX - start.current.x) * (reverse ? -1 : 1),
            ),
          );
      }}
      onPointerUp={(e) => {
        start.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onLostPointerCapture={() => {
        start.current = null;
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onChange(
            clamp(
              value + (e.key === "ArrowRight" ? 10 : -10) * (reverse ? -1 : 1),
            ),
          );
        }
      }}
    />
  );
}
