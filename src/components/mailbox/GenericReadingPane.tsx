"use client";

import { useEffect, useRef } from "react";
import { Icons } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useEmailQuery } from "@/queries/useEmails";

export interface GenericReadingPaneProps {
  messageId?: string;
  folder: "inbox" | "trash" | "starred";
  onTrashEmail?: (id: string) => void;
  onRestoreEmail?: (id: string) => void;
  onDeleteEmail?: (id: string) => void;
  onReadEmail?: (id: string) => void;
  onUnreadEmail?: (id: string) => void;
  onStarEmail?: (id: string) => void;
  onUnstarEmail?: (id: string) => void;
}

function formatEmailTimeDetail(dateString: string | Date) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatEmailTimeShort(dateString: string | Date) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function GenericReadingPane({
  messageId,
  folder,
  onTrashEmail,
  onRestoreEmail,
  onDeleteEmail,
  onReadEmail,
  onUnreadEmail,
  onStarEmail,
  onUnstarEmail,
}: GenericReadingPaneProps) {
  const { data: emailData, isLoading, isError } = useEmailQuery(messageId);
  const email = emailData?.email;

  const markedReadRef = useRef<Set<string>>(new Set());

  // Mark email as read automatically if not already read (only in inbox)
  useEffect(() => {
    if (
      (folder === "inbox" || folder === "starred") &&
      email &&
      !email.isRead &&
      !markedReadRef.current.has(email.id) &&
      onReadEmail
    ) {
      markedReadRef.current.add(email.id);
      onReadEmail(email.id);
    }
  }, [email, folder, onReadEmail]);

  const handleStarToggle = () => {
    if (!email) return;
    if (email.isSaved && onUnstarEmail) {
      onUnstarEmail(email.id);
    } else if (!email.isSaved && onStarEmail) {
      onStarEmail(email.id);
    }
  };

  const handleToggleRead = () => {
    if (!email) return;
    if (email.isRead && onUnreadEmail) {
      onUnreadEmail(email.id);
    } else if (!email.isRead && onReadEmail) {
      onReadEmail(email.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-background h-full flex flex-col min-w-0 animate-in fade-in duration-300">
        <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
          <div className="h-4 w-32 bg-surface-hover rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto w-full">
          <div className="h-8 w-2/3 bg-surface-hover rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-surface-hover rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 bg-surface-hover rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-surface-hover rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full bg-surface-hover rounded animate-pulse" />
            <div className="h-4 w-full bg-surface-hover rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-surface-hover rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !email) {
    return (
      <div className="flex-1 bg-background h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-3">
          <Icons.Mail className="w-12 h-12 text-text-muted mx-auto" />
          <h3 className="text-lg font-semibold text-primary-text">
            No Email Selected
          </h3>
          <p className="text-text-secondary text-sm">
            Select an email from the list to view its contents, or set up
            inbound routing to receive new messages.
          </p>
        </div>
      </div>
    );
  }

  const initials =
    (email.fromName || email.fromAddress)[0]?.toUpperCase() || "U";
  const displaySender = email.fromName || email.fromAddress;

  return (
    <div className="flex-1 bg-background h-full flex flex-col min-w-0 animate-in fade-in duration-300">
      {/* Header / Toolbar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {(folder === "inbox" || folder === "starred") && (
            <>
              {(onReadEmail || onUnreadEmail) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleRead}
                  title={email.isRead ? "Mark as unread" : "Mark as read"}
                >
                  <Icons.Mail className="w-5 h-5" />
                </Button>
              )}
              {(onStarEmail || onUnstarEmail) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStarToggle}
                  className={
                    email.isSaved
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-text-secondary"
                  }
                  title={email.isSaved ? "Unstar" : "Star"}
                >
                  <Icons.Star
                    className="w-5 h-5"
                    fill={email.isSaved ? "currentColor" : "none"}
                  />
                </Button>
              )}
              {onTrashEmail && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTrashEmail(email.id)}
                  title="Move to trash"
                  className="hover:text-destructive"
                >
                  <Icons.Trash className="w-5 h-5" />
                </Button>
              )}
            </>
          )}

          {folder === "trash" && (
            <>
              {onRestoreEmail && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRestoreEmail(email.id)}
                  title="Restore to inbox"
                  className="hover:text-accent"
                >
                  <Icons.Rollback className="w-5 h-5" />
                </Button>
              )}
              {onDeleteEmail && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteEmail(email.id)}
                  title="Delete permanently"
                  className="hover:text-destructive"
                >
                  <Icons.Trash className="w-5 h-5" />
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">
            {email.mailboxAddress.address}
          </span>
        </div>
      </div>

      {/* Email Content Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Email Subject */}
          <h1 className="text-[20px] sm:text-[24px] font-semibold text-primary-text mb-6">
            {email.subject}
          </h1>

          {/* Sender Meta Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Avatar initials={initials} size="md" />
              <div>
                <div className="font-medium text-[14px] text-primary-text">
                  {displaySender}{" "}
                  <span className="text-text-secondary font-normal ml-1 text-xs sm:text-sm">
                    &lt;{email.fromAddress}&gt;
                  </span>
                </div>
                <div className="text-[13px] text-text-secondary">to me</div>
              </div>
            </div>
            <div className="text-[13px] text-text-muted flex items-center gap-2">
              <span className="hidden sm:inline">
                {formatEmailTimeDetail(email.receivedAt)}
              </span>
              <span className="inline sm:hidden">
                {formatEmailTimeShort(email.receivedAt)}
              </span>
            </div>
          </div>

          {/* Email Body */}
          <div className="text-[14px] text-primary-text leading-[1.55] space-y-4 whitespace-pre-line">
            <p>{email.bodyText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
