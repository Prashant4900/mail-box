import type * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLElement> {
  initials: string;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
}

export function Avatar({
  initials,
  size = "sm",
  className,
  type = "button",
  onClick,
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const commonProps = {
    className: cn(
      "rounded-full bg-accent flex items-center justify-center text-background font-bold tracking-wider select-none shadow-sm transition-opacity outline-none",
      onClick ? "cursor-pointer hover:opacity-90" : "cursor-default",
      sizeClasses[size],
      className,
    ),
    onClick,
    ...props,
  };

  if (onClick) {
    return (
      <button
        type={type}
        {...(commonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {initials || "U"}
      </button>
    );
  }

  return (
    <div {...(commonProps as React.HTMLAttributes<HTMLDivElement>)}>
      {initials || "U"}
    </div>
  );
}
