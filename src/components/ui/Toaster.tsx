"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export function Toaster() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2 w-full max-w-[340px] pointer-events-none select-none">
      {toasts.map((toast) => {
        let Icon = Icons.Info;
        let iconColorClass = "text-text-secondary";
        let borderColorClass = "border-border";

        if (toast.type === "success") {
          Icon = Icons.Success;
          iconColorClass = "text-success";
          borderColorClass = "border-success/20";
        } else if (toast.type === "error") {
          Icon = Icons.Error;
          iconColorClass = "text-destructive";
          borderColorClass = "border-destructive/20";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border bg-background shadow-md ${borderColorClass} animate-in slide-in-from-bottom-3 fade-in duration-200`}
            role="alert"
          >
            {/* Type Icon */}
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColorClass}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium leading-normal text-text-primary">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-text-muted hover:text-text-primary mt-0.5"
              aria-label="Dismiss toast"
            >
              <Icons.Close className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
