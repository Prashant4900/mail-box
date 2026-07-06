import type * as React from "react";
import { cn } from "@/lib/utils";

export interface FeedbackBannerProps
  extends React.ComponentPropsWithoutRef<"div"> {
  type: "success" | "error" | "warning";
  message: React.ReactNode;
}

export function FeedbackBanner({
  type,
  message,
  className,
  ...props
}: FeedbackBannerProps) {
  const styles = {
    success: "text-success bg-success/5 border-success/15",
    error: "text-destructive bg-destructive/5 border-destructive/15",
    warning: "text-warning bg-warning/5 border-warning/15",
  };

  return (
    <div
      role="alert"
      className={cn(
        "p-3 text-[13px] rounded-md border font-medium animate-in fade-in duration-200",
        styles[type],
        className,
      )}
      {...props}
    >
      {message}
    </div>
  );
}
