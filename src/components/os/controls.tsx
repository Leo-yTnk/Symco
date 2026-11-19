import {
  useId,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "secondary" | "primary" | "danger" | "icon" | "link";
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonProps) {
  const appearance =
    variant === "icon"
      ? "os-icon-button"
      : variant === "link"
        ? "os-link"
        : variant === "secondary"
          ? "os-button"
          : `os-button ${variant}`;
  return (
    <button
      type="button"
      className={`${appearance} ${className}`.trim()}
      {...props}
    />
  );
}

export function Badge({
  state,
  children,
}: {
  state: string;
  children: ReactNode;
}) {
  return <span className={`os-badge ${state}`}>{children}</span>;
}

export function StatusSwitch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="os-switch"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
    >
      <span aria-hidden="true" />
    </button>
  );
}

export function Metric({
  icon,
  label,
  value,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className={`os-kpi tone-${tone}`}>
      <span className="os-metric-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  label,
  wide,
  wrap,
  ...props
}: {
  options: Record<Value, string>;
  value: Value;
  onChange: (value: Value) => void;
  label: string;
  wide?: boolean;
  wrap?: boolean;
  "data-tour"?: string;
}) {
  const active = useRef<HTMLButtonElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const button = active.current;
    const indicator = marker.current;
    const group = indicator?.parentElement;
    if (!button || !indicator || !group) return;
    const position = () => {
      indicator.style.translate = `${button.offsetLeft}px ${button.offsetTop}px`;
      indicator.style.height = `${button.offsetHeight}px`;
      indicator.style.width = `${button.offsetWidth}px`;
      if (indicator.hasAttribute("data-initial")) {
        indicator.getBoundingClientRect();
        indicator.removeAttribute("data-initial");
      }
    };
    position();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(position);
    observer.observe(group);
    for (const option of group.querySelectorAll("button"))
      observer.observe(option);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      {...props}
      className={`os-segmented ${wide ? "os-tabs" : "os-view-tabs"}`}
      data-wrap={wrap || undefined}
      role="group"
      aria-label={label}
    >
      <span
        ref={marker}
        className="os-segment-marker"
        data-initial=""
        aria-hidden="true"
      />
      {(Object.keys(options) as Value[]).map((option) => (
        <button
          key={option}
          type="button"
          ref={option === value ? active : undefined}
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {options[option]}
        </button>
      ))}
    </div>
  );
}

export function Disclosure({
  label,
  open,
  onToggle,
  children,
  className = "",
}: {
  label: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <>
      <button
        className={`os-group-title ${className}`}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        {label}
      </button>
      <div
        id={id}
        className="os-disclosure"
        data-open={open}
        aria-hidden={!open}
        ref={(element) => element?.toggleAttribute("inert", !open)}
      >
        <div>{children}</div>
      </div>
    </>
  );
}
