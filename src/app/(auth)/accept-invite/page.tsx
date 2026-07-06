"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("AcceptInvite");

  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Verify token on mount
  useEffect(() => {
    if (!token) {
      setError(t("verifyingTokenError"));
      setVerifying(false);
      return;
    }

    fetch(`/api/auth/invite/validate?token=${token}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.success) {
          setEmail(body.data.email);
        } else {
          setError(body.error || t("invalidTokenError"));
        }
      })
      .catch(() => {
        setError(t("verifyingFailedError"));
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password.length < 8) {
      setFormError(t("passwordLengthError"));
      return;
    }

    if (password !== confirmPassword) {
      setFormError(t("passwordsMismatch"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json();

      if (body.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?invite=success");
        }, 3000);
      } else {
        setFormError(body.error || t("acceptInviteFailed"));
      }
    } catch {
      setFormError(t("networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="w-6 h-6 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-text-secondary">
          {t("verifying")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
        <FeedbackBanner type="error" message={error} />
        <Button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full h-9 rounded-md font-semibold text-[13px]"
        >
          {t("returnToLogin")}
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center animate-in fade-in duration-300 py-4">
        <FeedbackBanner
          type="success"
          message={t("successMessage")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="text-center">
        <h2 className="text-[20px] font-semibold text-text-primary tracking-tight">
          {t("title")}
        </h2>
        <p className="text-[13px] text-text-secondary mt-1">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && <FeedbackBanner type="error" message={formError} />}

        <FormField
          id="email"
          name="email"
          type="email"
          value={email || ""}
          label={t("emailLabel")}
          disabled
          required
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label={t("passwordLabel")}
          placeholder={t("passwordPlaceholder")}
          required
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label={t("confirmPasswordLabel")}
          placeholder={t("confirmPasswordPlaceholder")}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2 h-9 rounded-md font-semibold text-[13px]"
          disabled={submitting}
        >
          {submitting ? t("submitting") : t("submitButton")}
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
