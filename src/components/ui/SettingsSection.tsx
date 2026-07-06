import type * as React from "react";
import { cn } from "@/lib/utils";

export interface SettingsSectionProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
  ...props
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "grid grid-cols-1 gap-6 rounded-lg border border-border bg-background px-6 py-7 shadow-sm md:grid-cols-[240px_minmax(0,1fr)] md:gap-12",
        className,
      )}
      {...props}
    >
      <div className="md:col-span-1 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description && (
          <p className="text-[13px] text-text-secondary">{description}</p>
        )}
      </div>
      <div className="w-full flex flex-col gap-4">{children}</div>
    </section>
  );
}
