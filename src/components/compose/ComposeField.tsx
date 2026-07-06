import type React from "react";
import { Input } from "@/components/ui/Input";

interface ComposeFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightAdornment?: React.ReactNode;
}

export function ComposeField({
  label,
  rightAdornment,
  className,
  ...props
}: ComposeFieldProps) {
  return (
    <div className="flex items-center">
      <label
        htmlFor={props.id || props.name}
        className="w-24 text-sm font-medium text-text-secondary"
      >
        {label}:
      </label>
      <div className="flex-1 flex items-center gap-2">
        <Input
          id={props.id || props.name}
          className={`h-10 text-sm bg-transparent ${className || ""}`}
          {...props}
        />
        {rightAdornment}
      </div>
    </div>
  );
}
