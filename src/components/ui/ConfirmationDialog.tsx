"use client";

import { Button } from "@/components/ui/Button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 dark:bg-black/60 cursor-default animate-in fade-in duration-200"
        onClick={onCancel}
        aria-label="Close confirmation background"
      />

      {/* Dialog Box */}
      <div className="bg-background border border-border w-full max-w-sm p-6 rounded-xl shadow-xl z-50 animate-in zoom-in-95 duration-200 flex flex-col gap-4 relative">
        <h3 className="font-semibold text-text-primary text-[15.5px]">
          {title}
        </h3>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end gap-2 mt-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-8.5 text-[12px] px-3 font-medium cursor-pointer"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            className="h-8.5 text-[12px] px-4 font-semibold cursor-pointer"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
