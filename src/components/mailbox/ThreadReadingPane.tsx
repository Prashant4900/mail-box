"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { EmailThread, EmailWithState } from "@/types";

export interface ThreadReadingPaneProps {
  thread?: EmailThread;
  folder: "inbox" | "trash" | "starred" | "drafts";
  onTrashEmail?: (id: string) => void;
  onRestoreEmail?: (id: string) => void;
  onDeleteEmail?: (id: string) => void;
  onReadEmail?: (id: string) => void;
  onUnreadEmail?: (id: string) => void;
  onStarEmail?: (id: string) => void;
  onUnstarEmail?: (id: string) => void;
  onBulkTrash?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
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

// Split bodyText into the new content written in this reply and the quoted block.
// Returns { body: string, quoted: string | null }
function splitQuoted(bodyText: string): {
  body: string;
  quoted: string | null;
} {
  const lines = bodyText.split("\n");
  // Find the first line that looks like a Gmail-style "On <date> ... wrote:" header
  // or a consecutive block of "> " quoted lines
  const quoteHeaderPattern = /^on\s.+wrote:\s*$/i;

  let splitIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // A line starting with ">" that is part of a quoted block
    if (line.startsWith(">")) {
      // Walk back to include the "On ... wrote:" line above it if present
      const prevLine = (lines[i - 1] || "").trim();
      if (quoteHeaderPattern.test(prevLine) && i > 0) {
        splitIndex = i - 1;
      } else {
        splitIndex = i;
      }
      break;
    }
    // Also catch the "On <date> ... wrote:" line even before the ">" block
    if (quoteHeaderPattern.test(line) && i < lines.length - 1) {
      const nextLine = (lines[i + 1] || "").trim();
      if (nextLine.startsWith(">") || nextLine === "") {
        splitIndex = i;
        break;
      }
    }
  }

  if (splitIndex === -1) {
    return { body: bodyText.trim(), quoted: null };
  }

  const body = lines.slice(0, splitIndex).join("\n").trim();
  const quoted = lines.slice(splitIndex).join("\n").trim();
  return { body, quoted };
}

// A single collapsed/expanded email bubble inside the thread
function EmailBubble({
  email,
  isExpanded,
  onToggle,
}: {
  email: EmailWithState;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [showQuoted, setShowQuoted] = useState(false);
  const { body, quoted } = splitQuoted(email.bodyText);

  const initials =
    (email.fromName || email.fromAddress)[0]?.toUpperCase() || "U";
  const displaySender = email.fromName || email.fromAddress;

  return (
    <div className="border-b border-border/40 last:border-0 mb-4 last:mb-0 pb-4 last:pb-0 transition-all duration-200">
      {/* Bubble header — always visible, click to expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 px-2 -mx-2 hover:bg-surface-hover/40 rounded-lg transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar initials={initials} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[13px] truncate ${
                  !email.isRead
                    ? "font-semibold text-primary-text"
                    : "font-medium text-text-secondary"
                }`}
              >
                {displaySender}
                {email.fromName && email.fromName !== email.fromAddress && (
                  <span className="text-text-muted font-normal ml-1.5">
                    &lt;{email.fromAddress}&gt;
                  </span>
                )}
              </span>
              {!email.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              )}
            </div>
            {isExpanded ? (
              <p className="text-[11px] text-text-muted truncate mt-0.5">
                to {email.mailboxAddress.address}
              </p>
            ) : (
              <p className="text-[12px] text-text-muted truncate max-w-[280px]">
                {body.split("\n")[0]}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[11px] text-text-muted hidden sm:inline">
            {formatEmailTimeDetail(email.receivedAt)}
          </span>
          <span className="text-[11px] text-text-muted inline sm:hidden">
            {formatEmailTimeShort(email.receivedAt)}
          </span>
          {isExpanded ? (
            <Icons.ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <Icons.ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-2 mt-2">
          {/* Body — only the new content in this reply */}
          <div className="text-[14px] text-primary-text leading-[1.6] whitespace-pre-line">
            {body || email.bodyText}
          </div>

          {/* Quoted block — collapsed behind a toggle */}
          {quoted && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowQuoted(!showQuoted)}
                className="text-[11px] text-text-muted hover:text-text-secondary flex items-center gap-1 border border-border rounded-md px-2 py-0.5 transition-colors"
              >
                <span>···</span>
                <span>
                  {showQuoted ? "Hide quoted text" : "Show quoted text"}
                </span>
              </button>
              {showQuoted && (
                <div className="mt-2 pl-3 border-l-2 border-border text-[13px] text-text-muted whitespace-pre-line leading-normal">
                  {quoted
                    .split("\n")
                    .map((line) => line.replace(/^>+\s?/, ""))
                    .join("\n")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ThreadReadingPane({
  thread,
  folder,
  onTrashEmail,
  onRestoreEmail,
  onDeleteEmail,
  onReadEmail,
  onStarEmail,
  onUnstarEmail,
  onBulkTrash,
  onBulkRestore,
  onBulkDelete,
}: ThreadReadingPaneProps) {
  const router = useRouter();
  const markedReadRef = useRef<Set<string>>(new Set());

  // Track which bubbles are expanded. Default: only the last email is open.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // When the thread changes, expand the latest email and auto-mark unread as read
  useEffect(() => {
    if (!thread) return;

    const latestId = thread.latestEmail.id;
    setExpandedIds(new Set([latestId]));

    // Auto-mark every unread email in the thread as read (inbox / starred only)
    if (folder === "inbox" || folder === "starred") {
      for (const email of thread.emails) {
        if (
          !email.isRead &&
          !markedReadRef.current.has(email.id) &&
          onReadEmail
        ) {
          markedReadRef.current.add(email.id);
          onReadEmail(email.id);
        }
      }
    }
  }, [thread, folder, onReadEmail]);

  const toggleBubble = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!thread) {
    return (
      <div className="flex-1 bg-background h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-3">
          <Icons.Mail className="w-12 h-12 text-text-muted mx-auto" />
          <h3 className="text-lg font-semibold text-primary-text">
            No Conversation Selected
          </h3>
          <p className="text-text-secondary text-sm">
            Select a conversation from the list to read it here.
          </p>
        </div>
      </div>
    );
  }

  const latestEmail = thread.latestEmail;

  return (
    <div className="flex-1 bg-background h-full flex flex-col min-w-0 animate-in fade-in duration-300">
      {/* Toolbar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-1">
          {folder === "drafts" && (
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                router.push(`/compose?draftId=${thread.threadKey}`)
              }
              className="mr-2"
            >
              <Icons.Edit className="w-4 h-4 mr-2" />
              Edit Draft
            </Button>
          )}
          {(folder === "inbox" || folder === "starred") && (
            <>
              {(onStarEmail || onUnstarEmail) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (latestEmail.isSaved && onUnstarEmail) {
                      onUnstarEmail(latestEmail.id);
                    } else if (!latestEmail.isSaved && onStarEmail) {
                      onStarEmail(latestEmail.id);
                    }
                  }}
                  className={
                    latestEmail.isSaved
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-text-secondary"
                  }
                  title={latestEmail.isSaved ? "Unstar thread" : "Star thread"}
                >
                  <Icons.Star
                    className="w-5 h-5"
                    fill={latestEmail.isSaved ? "currentColor" : "none"}
                  />
                </Button>
              )}
              {(onBulkTrash || onTrashEmail) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const ids = thread.emails.map((e) => e.id);
                    if (onBulkTrash) {
                      onBulkTrash(ids);
                    } else if (onTrashEmail) {
                      ids.forEach((id) => {
                        onTrashEmail(id);
                      });
                    }
                  }}
                  title="Move thread to trash"
                  className="hover:text-destructive"
                >
                  <Icons.Trash className="w-5 h-5" />
                </Button>
              )}
            </>
          )}
          {folder === "trash" && (onBulkRestore || onRestoreEmail) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const ids = thread.emails.map((e) => e.id);
                if (onBulkRestore) {
                  onBulkRestore(ids);
                } else if (onRestoreEmail) {
                  ids.forEach((id) => {
                    onRestoreEmail(id);
                  });
                }
              }}
              title="Restore thread to inbox"
              className="hover:text-accent"
            >
              <Icons.Rollback className="w-5 h-5" />
            </Button>
          )}
          {folder === "trash" && (onBulkDelete || onDeleteEmail) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const ids = thread.emails.map((e) => e.id);
                if (onBulkDelete) {
                  onBulkDelete(ids);
                } else if (onDeleteEmail) {
                  ids.forEach((id) => {
                    onDeleteEmail(id);
                  });
                }
              }}
              title="Delete thread permanently"
              className="hover:text-destructive"
            >
              <Icons.Trash className="w-5 h-5" />
            </Button>
          )}
        </div>
        <span className="text-[13px] text-text-muted">
          {folder === "drafts" ? "Draft" : latestEmail.mailboxAddress.address}
        </span>
      </div>

      {/* Conversation scroll area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="w-full">
          {/* Thread subject */}
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-primary-text mb-4">
            {thread.subject}
          </h1>

          {/* Message count pill */}
          {thread.messageCount > 1 && (
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[12px] text-text-muted">
                {thread.messageCount} messages in this conversation
              </span>
            </div>
          )}

          {/* Email bubbles — oldest first, latest expanded */}
          {thread.emails.map((email) => (
            <EmailBubble
              key={email.id}
              email={email}
              isExpanded={expandedIds.has(email.id)}
              onToggle={() => toggleBubble(email.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
