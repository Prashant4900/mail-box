"use client";

import { Icons } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import type { EmailJob } from "@/types";

export interface SentReadingPaneProps {
  job?: EmailJob;
}

function formatEmailTimeDetail(dateString: string | Date) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function SentReadingPane({ job }: SentReadingPaneProps) {
  if (!job) {
    return (
      <div className="flex-1 bg-background h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-3">
          <Icons.Mail className="w-12 h-12 text-text-muted mx-auto" />
          <h3 className="text-lg font-semibold text-primary-text">
            No Email Selected
          </h3>
          <p className="text-text-secondary text-sm">
            Select an email from the list to read it here.
          </p>
        </div>
      </div>
    );
  }

  const initials = job.to[0]?.toUpperCase() || "U";

  return (
    <div className="flex-1 bg-background h-full flex flex-col min-w-0 animate-in fade-in duration-300">
      {/* Toolbar */}
      <div className="h-14 flex items-center justify-end px-6 border-b border-border shrink-0">
        <span className="text-[13px] text-text-muted">
          Sent from: {job.fromAddress}
        </span>
      </div>

      {/* Conversation scroll area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="w-full">
          {/* Thread subject */}
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-primary-text mb-4">
            {job.subject}
          </h1>

          <div className="border-b border-border/40 pb-4 mb-4">
            {/* Bubble header */}
            <div className="w-full flex items-center justify-between py-2 -mx-2">
              <div className="flex items-center gap-3 min-w-0 px-2">
                <Avatar initials={initials} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] truncate font-semibold text-primary-text">
                      To: {job.to}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                    {job.cc && `Cc: ${job.cc} `}
                    {job.bcc && `Bcc: ${job.bcc}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-2 px-2">
                <span className="text-[11px] text-text-muted">
                  {formatEmailTimeDetail(job.createdAt)}
                </span>
                {job.status === "PENDING" && (
                  <span className="text-[10px] text-text-muted bg-surface border border-border rounded-full px-2 py-0.5">
                    Sending...
                  </span>
                )}
                {job.status === "FAILED" && (
                  <span className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-2 py-0.5">
                    Failed
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-2 mt-4">
              <div className="text-[14px] text-primary-text leading-[1.6] whitespace-pre-line">
                {job.bodyText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
