"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="group relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Icons.Sun className="w-5 h-5" />
        ) : (
          <Icons.Moon className="w-5 h-5" />
        )}
      </Button>
      <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 bg-accent text-background text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap z-50">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </div>
  );
}
