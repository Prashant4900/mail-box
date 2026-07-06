"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";
import { useLoginMutation } from "@/queries/useAuth";
import { useAppStore } from "@/store/useAppStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Login");
  const { mutateAsync: login, isPending: loading } = useLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useAppStore();

  useEffect(() => {
    const setup = searchParams.get("setup");
    const forgot = searchParams.get("forgot");
    const reset = searchParams.get("reset");

    if (setup === "success" || forgot === "success" || reset === "success") {
      if (setup === "success") addToast(t("setupSuccess"), "success");
      if (forgot === "success") addToast(t("forgotSuccess"), "success");
      if (reset === "success") addToast(t("resetSuccess"), "success");

      // Clean up URL parameters to avoid showing the toast again on refresh
      const params = new URLSearchParams(searchParams.toString());
      params.delete("setup");
      params.delete("forgot");
      params.delete("reset");
      const queryString = params.toString();
      router.replace(queryString ? `/login?${queryString}` : "/login");
    }
  }, [searchParams, t, addToast, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login({ email, password });
      router.push("/"); // Redirect to mailbox home/dashboard
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

        <FormField
          id="password"
          name="password"
          type="password"
          label={
            <span className="flex justify-between items-baseline w-full">
              <span>{t("password")}</span>
              <Link
                href="/forgot-password"
                className="text-[11.5px] text-text-secondary hover:text-text-primary hover:underline font-normal normal-case tracking-normal"
              >
                {t("forgotPassword")}
              </Link>
            </span>
          }
          placeholder={t("passwordPlaceholder")}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2 h-9 rounded-md font-semibold text-[13px]"
          disabled={loading}
        >
          {loading ? t("loggingIn") : t("loginButton")}
        </Button>
      </form>
    </div>
  );
}
