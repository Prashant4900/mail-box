"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setUserLocale } from "@/actions/locale";
import { Button } from "@/components/ui/Button";

export function LocaleToggle() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "es" : "en";
    startTransition(() => {
      setUserLocale(nextLocale);
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      disabled={isPending}
      className="uppercase font-semibold min-w-8"
      aria-label="Toggle language"
    >
      {locale}
    </Button>
  );
}
