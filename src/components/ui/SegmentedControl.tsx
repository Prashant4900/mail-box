import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  uppercase?: boolean;
  capitalize?: boolean;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  uppercase = false,
  capitalize = false,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center border border-border rounded-md p-0.5 bg-surface",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          disabled={disabled || opt.disabled}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
            uppercase && "uppercase",
            capitalize && "capitalize",
            value === opt.value
              ? "bg-background shadow-sm text-text-primary"
              : "text-text-secondary hover:text-text-primary disabled:opacity-50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
