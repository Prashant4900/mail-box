"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Icons } from "@/components/icons";
import { SentMailboxLayout } from "@/components/mailbox/SentMailboxLayout";
import { useSentEmailsQuery } from "@/queries/useEmails";

function SentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") ?? undefined;
  const searchQuery = searchParams.get("search") || undefined;
  const statusQuery = searchParams.get("status") || undefined;

  const t = useTranslations("Sidebar");
  const tSent = useTranslations("Sent");

  const { data, isLoading, isError } = useSentEmailsQuery({
    search: searchQuery,
    status: statusQuery,
  });

  const jobs = data?.items || [];

  return (
    <SentMailboxLayout
      jobs={jobs}
      isLoading={isLoading}
      isError={isError}
      selectedJobId={jobId}
      title={t("sent")}
      emptyStateTitle={tSent("emptyStateTitle")}
      emptyStateDescription={tSent("emptyStateDescription")}
      emptyStateIcon={<Icons.Sent className="w-7 h-7 text-text-muted" />}
      currentStatus={statusQuery}
      onStatusChange={(newStatus) => {
        const url = new URL(window.location.href);
        if (newStatus) {
          url.searchParams.set("status", newStatus);
        } else {
          url.searchParams.delete("status");
        }
        url.searchParams.delete("jobId");
        router.push(url.pathname + url.search);
      }}
    />
  );
}

export default function SentPage() {
  const tSent = useTranslations("Sent");

  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background text-text-secondary text-sm">
          {tSent("loading")}
        </div>
      }
    >
      <SentContent />
    </Suspense>
  );
}
