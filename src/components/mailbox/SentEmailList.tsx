"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { UI_EMAIL_LIMIT } from "@/lib/constants";
import type { EmailJob } from "@/types";

export interface SentEmailListProps {
  jobs: EmailJob[];
  selectedJobId?: string;
  title: string;
  currentStatus?: string;
  onStatusChange: (status: string) => void;
}

const FILTER_ITEM_BASE = "w-full justify-start font-normal text-left";
const FILTER_ITEM_INACTIVE = "text-text-secondary";
const FILTER_ITEM_ACTIVE = "font-semibold text-accent";

function formatEmailTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function SentEmailList({
  jobs,
  selectedJobId,
  title,
  currentStatus,
  onStatusChange,
}: SentEmailListProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page when jobs change
  useEffect(() => {
    setPage(1);
  }, []);

  const totalPages = Math.ceil(jobs.length / UI_EMAIL_LIMIT);
  const displayedJobs = jobs.slice(
    (page - 1) * UI_EMAIL_LIMIT,
    page * UI_EMAIL_LIMIT,
  );

  const activeId = selectedJobId ?? displayedJobs[0]?.id;

  return (
    <div className="w-full md:w-[360px] bg-background border-r border-border h-full flex flex-col shrink-0 select-none">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-[15px] text-primary-text">
            {title}
          </h2>
        </div>
        <div className="relative" ref={filterRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`relative ${
              showFilterMenu
                ? "bg-black/5 dark:bg-white/5 text-text-primary"
                : ""
            }`}
            title="Filter by status"
          >
            <Icons.Filter className="w-4 h-4" />
            {currentStatus && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            )}
          </Button>
          {showFilterMenu && (
            <div className="absolute right-0 top-6 mt-1.5 w-32 bg-background border border-border rounded-xl shadow-lg z-50 py-1.5 animate-in slide-in-from-top-1.5 fade-in duration-200">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onStatusChange("");
                  setShowFilterMenu(false);
                }}
                className={`${FILTER_ITEM_BASE} ${
                  !currentStatus ? FILTER_ITEM_ACTIVE : FILTER_ITEM_INACTIVE
                }`}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onStatusChange("SENT");
                  setShowFilterMenu(false);
                }}
                className={`${FILTER_ITEM_BASE} ${
                  currentStatus === "SENT"
                    ? FILTER_ITEM_ACTIVE
                    : FILTER_ITEM_INACTIVE
                }`}
              >
                Sent
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onStatusChange("PENDING");
                  setShowFilterMenu(false);
                }}
                className={`${FILTER_ITEM_BASE} ${
                  currentStatus === "PENDING"
                    ? FILTER_ITEM_ACTIVE
                    : FILTER_ITEM_INACTIVE
                }`}
              >
                Pending
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onStatusChange("FAILED");
                  setShowFilterMenu(false);
                }}
                className={`${FILTER_ITEM_BASE} ${
                  currentStatus === "FAILED"
                    ? FILTER_ITEM_ACTIVE
                    : FILTER_ITEM_INACTIVE
                }`}
              >
                Failed
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {displayedJobs.length === 0 && (
          <div className="p-8 text-center text-text-muted text-[13px]">
            No sent emails found.
          </div>
        )}

        {displayedJobs.map((job) => {
          const recipientDisplay =
            job.to.split(",")[0] + (job.to.includes(",") ? "..." : "");
          const timeStr = formatEmailTime(job.createdAt);
          const isActive = job.id === activeId;

          return (
            <div
              key={job.id}
              className={`group relative flex items-center border-b border-border transition-colors hover:bg-surface-hover/80 ${
                isActive ? "bg-accent-subtle" : ""
              }`}
            >
              {/* Row */}
              <button
                type="button"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("jobId", job.id);
                  router.push(url.pathname + url.search);
                }}
                className={`flex-1 text-left py-3 pl-4 pr-4 outline-none cursor-pointer relative min-w-0`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-2 pr-6 min-w-0">
                    <span className="text-[13px] truncate font-medium text-text-secondary">
                      To: {recipientDisplay}
                    </span>
                    {job.status === "SENT" && (
                      <span className="text-[10px] text-accent bg-accent/10 border border-accent/20 rounded-full px-1.5 py-0 shrink-0 leading-5">
                        Sent
                      </span>
                    )}
                    {job.status === "PENDING" && (
                      <span className="text-[10px] text-text-muted bg-surface border border-border rounded-full px-1.5 py-0 shrink-0 leading-5">
                        Sending
                      </span>
                    )}
                    {job.status === "FAILED" && (
                      <span className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-1.5 py-0 shrink-0 leading-5">
                        Failed
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted shrink-0 ml-2">
                    {timeStr}
                  </span>
                </div>

                <h3 className="text-[14px] leading-snug truncate mb-1 pr-6 font-medium text-primary-text">
                  {job.subject}
                </h3>

                <p className="text-[13px] text-text-secondary leading-snug line-clamp-2">
                  {/* Show only the snippet */}
                  {job.bodyText
                    .split("\n")
                    .filter(
                      (line) => !line.startsWith(">") && line.trim() !== "",
                    )
                    .join(" ")
                    .slice(0, 160)}
                </p>
              </button>
            </div>
          );
        })}
      </div>

      {/* Paging footer */}
      {totalPages > 1 && (
        <div className="h-12 border-t border-border px-4 flex items-center justify-between shrink-0 bg-surface/10">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="h-8 w-8 text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all active:scale-95"
            title="Previous Page"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-[12px] font-medium text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="h-8 w-8 text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all active:scale-95"
            title="Next Page"
          >
            <Icons.ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
