"use client";

import type React from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 cursor-default outline-none animate-in fade-in duration-200"
        aria-label="Close modal background"
      />

      {/* Content Container */}
      <div className="bg-background border border-border w-full max-w-md p-6 rounded-xl shadow-xl z-50 animate-in zoom-in-95 duration-200 flex flex-col gap-4 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-semibold text-text-primary text-[15px]">
            {title}
          </h3>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Close modal dialog"
            className="rounded-full"
          >
            <Icons.Close className="w-4 h-4 text-text-secondary" />
          </Button>
        </div>

        {/* Modal Body */}
        {children}
      </div>
    </div>
  );
}
