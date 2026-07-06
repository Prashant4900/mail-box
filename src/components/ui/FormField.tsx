import type * as React from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

export interface FormFieldProps
  extends React.ComponentPropsWithoutRef<typeof Input> {
  label?: React.ReactNode;
  error?: string;
}

export function FormField({
  label,
  error,
  id,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <Label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary"
        >
          {label}
        </Label>
      )}
      <Input
        id={id}
        className={cn(
          "h-9 px-3 text-[13.5px] rounded-md border border-border bg-background placeholder:text-text-muted focus:border-text-primary focus:ring-0 focus-visible:ring-0",
          error && "border-destructive focus:border-destructive",
          className,
        )}
        {...props}
      />
      {error && (
        <span className="text-[11px] text-destructive font-medium mt-0.5 animate-in fade-in duration-200">
          {error}
        </span>
      )}
    </div>
  );
}
