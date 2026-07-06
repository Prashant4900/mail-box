"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";
import { useForgotPasswordMutation } from "@/queries/useAuth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useTranslations("ForgotPassword");
  const { mutateAsync: forgotPassword, isPending: loading } =
    useForgotPasswordMutation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      await forgotPassword(email);
      router.push("/login?forgot=success");
    } catch (err) {
      const errorVal = err instanceof Error ? err.message : "An error occurred";
      setError(errorVal);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="text-center">
        <h2 className="text-[20px] font-semibold text-text-primary tracking-tight">
          {t("title")}
        </h2>
        <p className="text-[13px] text-text-secondary mt-1">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <FeedbackBanner type="error" message={error} />}

        <FormField
          id="email"
          name="email"
          type="email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2 h-9 rounded-md font-semibold text-[13px]"
          disabled={loading}
        >
          {loading ? t("sending") : t("sendResetLink")}
        </Button>
      </form>

      <div className="text-center mt-2">
        <Link
          href="/login"
          className="text-[13px] text-text-primary font-medium hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
