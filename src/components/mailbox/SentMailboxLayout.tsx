"use client";

import type React from "react";
import type { EmailJob } from "@/types";
import { SentEmailList } from "./SentEmailList";
import { SentReadingPane } from "./SentReadingPane";

export interface SentMailboxLayoutProps {
  jobs: EmailJob[];
  isLoading: boolean;
  isError: boolean;
  selectedJobId?: string;
  title: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateIcon: React.ReactNode;
  currentStatus?: string;
  onStatusChange: (status: string) => void;
}

export function SentMailboxLayout({
  jobs,
  isLoading,
  isError,
  selectedJobId,
  title,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateIcon,
  currentStatus,
  onStatusChange,
}: SentMailboxLayoutProps) {
  const activeId = selectedJobId ?? jobs[0]?.id;
  const activeJob = jobs.find((j) => j.id === activeId);

  if (isLoading) {
    return (
      <div className="flex h-full w-full overflow-hidden">
        <div className="h-full shrink-0 w-full md:w-[360px] border-r border-border flex flex-col">
          <div className="h-14 flex items-center px-4 border-b border-border">
            <div className="h-4 w-24 bg-surface-hover rounded animate-pulse" />
          </div>
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse space-y-2 py-3 border-b border-border last:border-0"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-surface-hover rounded" />
                  <div className="h-3 w-12 bg-surface-hover rounded" />
                </div>
                <div className="h-4 w-40 bg-surface-hover rounded" />
                <div className="h-3 w-full bg-surface-hover rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:flex flex-1 flex-col h-full bg-background">
          <div className="h-14 flex items-center px-6 border-b border-border shrink-0">
            <div className="h-4 w-32 bg-surface-hover rounded animate-pulse" />
          </div>
          <div className="flex-1 p-8 space-y-6 max-w-3xl mx-auto w-full">
            <div className="h-8 w-2/3 bg-surface-hover rounded animate-pulse" />
            <div className="h-20 w-full bg-surface-hover rounded animate-pulse" />
            <div className="h-20 w-full bg-surface-hover rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-background">
        <div className="max-w-md text-center space-y-3">
          <div className="text-error font-medium text-[15px]">
            Failed to load sent emails
          </div>
          <p className="text-text-secondary text-[13px]">
            Please check your connection and reload the page.
          </p>
        </div>
      </div>
    );
  }

  // NOTE: If currentStatus is active, we might have 0 jobs and want to show empty state
  // But we still need the list to show the header with the active filter.
  // We'll let the list render the empty state instead, unless there's no jobs AND no status filter.
  if (jobs.length === 0 && !currentStatus) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-surface/35 text-center animate-in fade-in duration-300">
        <div className="max-w-md space-y-4 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm">
            {emptyStateIcon}
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-text-primary mb-1">
              {emptyStateTitle}
            </h3>
            <p className="text-[13px] text-text-secondary max-w-xs leading-relaxed">
              {emptyStateDescription}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* List pane */}
      <div
        className={`h-full shrink-0 md:w-[360px] ${
          selectedJobId ? "hidden md:block" : "w-full"
        }`}
      >
        <SentEmailList
          jobs={jobs}
          selectedJobId={activeId}
          title={title}
          currentStatus={currentStatus}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* Reading pane */}
      <div
        className={`h-full flex-1 min-w-0 ${
          selectedJobId ? "block" : "hidden md:block"
        }`}
      >
        <SentReadingPane job={activeJob} />
      </div>
    </div>
  );
}
