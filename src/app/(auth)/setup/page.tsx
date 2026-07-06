"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";
import { useSetupMutation } from "@/queries/useAuth";

export default function SetupPage() {
  const router = useRouter();
  const t = useTranslations("Setup");
  const { mutateAsync: setup, isPending: loading } = useSetupMutation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    try {
      await setup({ firstName, lastName, email, password });
      router.push("/login?setup=success");
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="firstName"
            name="firstName"
            label={t("firstName")}
            placeholder={t("firstNamePlaceholder")}
            required
          />
          <FormField
            id="lastName"
            name="lastName"
            label={t("lastName")}
            placeholder={t("lastNamePlaceholder")}
            required
          />
        </div>

        <FormField
          id="email"
          name="email"
          type="email"
          defaultValue="owner@example.com"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          required
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label={t("password")}
          placeholder={t("passwordPlaceholder")}
          required
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
          {loading ? t("creatingAccount") : t("completeSetup")}
        </Button>
      </form>
    </div>
  );
}
