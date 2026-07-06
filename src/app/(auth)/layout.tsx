import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";
import { AUTH_CONFIG } from "@/lib/auth";
import { SessionService } from "@/services/session.service";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("Metadata.auth");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_CONFIG.session.cookieName)?.value;

  if (sessionToken) {
    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (sessionData) {
      redirect("/");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-[340px] md:max-w-[360px] flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="text-text-primary mb-3">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Mailbox Logo</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-primary leading-tight">
            Mailbox
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
