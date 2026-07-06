"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";
import { useResetPasswordMutation } from "@/queries/useAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("ResetPassword");

  const { mutateAsync: resetPassword, isPending: loading } =
    useResetPasswordMutation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    try {
      await resetPassword({ token, password });
      router.push("/login?reset=success");
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
          id="password"
          name="password"
          type="password"
          label={t("newPassword")}
          placeholder={t("newPasswordPlaceholder")}
          required
          minLength={8}
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label={t("confirmPassword")}
          placeholder={t("confirmPasswordPlaceholder")}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2 h-9 rounded-md font-semibold text-[13px]"
          disabled={loading}
        >
          {loading ? t("resetting") : t("resetButton")}
        </Button>
      </form>

      <div className="text-center mt-2">
        <Link
          href="/login"
          className="text-[13px] text-text-primary font-medium hover:underline"
        >
          {t("goToLogin")}
        </Link>
      </div>
    </div>
  );
}
