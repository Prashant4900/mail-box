import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/mailbox/Navbar";
import { Sidebar } from "@/components/mailbox/Sidebar";
import { AUTH_CONFIG } from "@/lib/auth";
import { UserRepository } from "@/repositories/user.repository";
import { SessionService } from "@/services/session.service";

export async function generateMetadata() {
  const t = await getTranslations("Metadata.inbox");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_CONFIG.session.cookieName)?.value;

  // 1. Check if setup is complete
  const ownerCount = await UserRepository.countOwners();
  if (ownerCount === 0) {
    redirect("/setup");
  }

  // 2. If no session cookie, redirect to login
  if (!sessionToken) {
    redirect("/login");
  }

  // 3. Validate session in DB
  const sessionData = await SessionService.getSessionAndUser(sessionToken);
  if (!sessionData) {
    redirect("/login");
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <Suspense
          fallback={
            <div className="h-14 border-b border-border bg-background shrink-0" />
          }
        >
          <Navbar />
        </Suspense>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </main>
  );
}
