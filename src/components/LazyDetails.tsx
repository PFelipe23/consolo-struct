import { useState, type ReactNode } from "react";

/** Native disclosure with no hidden report tables or formatting work before opening. */
export default function LazyDetails({
  title,
  className,
  children,
}: {
  title: ReactNode;
  className?: string;
  children: () => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={className}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>{title}</summary>
      {open ? children() : null}
    </details>
  );
}
