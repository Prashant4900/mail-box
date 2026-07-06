"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { UI_EMAIL_LIMIT } from "@/lib/constants";
import type { EmailThread } from "@/types";

export interface ThreadEmailListProps {
  threads: EmailThread[];
  selectedThreadKey?: string;
  folder: "inbox" | "trash" | "starred" | "drafts";
  onTrashThread?: (ids: string[]) => void;
  onRestoreThread?: (ids: string[]) => void;
  onDeleteThread?: (ids: string[]) => void;
  title: string;
  // Multi-select
  selectedKeys: string[];
  onToggleSelect: (key: string) => void;
  onToggleSelectAll: (filteredKeys: string[]) => void;
  onBulkTrash?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRead?: (ids: string[]) => void;
  onBulkUnread?: (ids: string[]) => void;
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

// Collect all email IDs inside a set of threads
function emailIdsForKeys(threads: EmailThread[], keys: string[]): string[] {
  const ids: string[] = [];
  for (const thread of threads) {
    if (keys.includes(thread.threadKey)) {
      for (const email of thread.emails) {
        ids.push(email.id);
      }
    }
  }
  return ids;
}

export function ThreadEmailList({
  threads,
  selectedThreadKey,
  folder,
  onTrashThread,
  onRestoreThread,
  onDeleteThread,
  title,
  selectedKeys,
  onToggleSelect,
  onToggleSelectAll,
  onBulkTrash,
  onBulkRestore,
  onBulkDelete,
  onBulkRead,
  onBulkUnread,
}: ThreadEmailListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

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

  // Reset page when threads change
  useEffect(() => {
    setPage(1);
  }, []);

  const filteredThreads = threads.filter((thread) => {
    if (filter === "read") return !thread.hasUnread;
    if (filter === "unread") return thread.hasUnread;
    return true;
  });

  const totalPages = Math.ceil(filteredThreads.length / UI_EMAIL_LIMIT);
  const displayedThreads = filteredThreads.slice(
    (page - 1) * UI_EMAIL_LIMIT,
    page * UI_EMAIL_LIMIT,
  );

  const activeKey = selectedThreadKey ?? filteredThreads[0]?.threadKey;
  const basePath =
    folder === "trash" ? "/trash" : folder === "starred" ? "/starred" : "/";
  const displayedKeys = displayedThreads.map((t) => t.threadKey);
  const areAllSelected =
    displayedKeys.length > 0 &&
    displayedKeys.every((key) => selectedKeys.includes(key));

  return (
    <div className="w-full md:w-[360px] bg-background border-r border-border h-full flex flex-col shrink-0 select-none">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
        {selectedKeys.length > 0 ? (
          <div className="flex items-center justify-between w-full animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={areAllSelected}
                onChange={() => onToggleSelectAll(displayedKeys)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <span className="text-[13px] font-semibold text-primary-text">
                {selectedKeys.length} selected
              </span>
            </div>
            <div className="flex items-center gap-1">
              {folder === "inbox" && (
                <>
                  {onBulkRead && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        onBulkRead(emailIdsForKeys(threads, selectedKeys))
                      }
                      title="Mark as read"
                    >
                      <Icons.Mail className="w-4 h-4 text-text-secondary" />
                    </Button>
                  )}
                  {onBulkUnread && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        onBulkUnread(emailIdsForKeys(threads, selectedKeys))
                      }
                      title="Mark as unread"
                    >
                      <Icons.Mail className="w-4 h-4 text-text-muted" />
                    </Button>
                  )}
                  {onBulkTrash && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        onBulkTrash(emailIdsForKeys(threads, selectedKeys))
                      }
                      title="Move to trash"
                      className="hover:text-destructive"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
              {folder === "trash" && (
                <>
                  {onBulkRestore && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        onBulkRestore(emailIdsForKeys(threads, selectedKeys))
                      }
                      title="Restore to inbox"
                      className="hover:text-accent"
                    >
                      <Icons.Rollback className="w-4 h-4" />
                    </Button>
                  )}
                  {onBulkDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        onBulkDelete(emailIdsForKeys(threads, selectedKeys))
                      }
                      title="Delete permanently"
                      className="hover:text-destructive"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
              {folder === "drafts" && onBulkDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    onBulkDelete(emailIdsForKeys(threads, selectedKeys))
                  }
                  title="Delete permanently"
                  className="hover:text-destructive"
                >
                  <Icons.Trash className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {displayedThreads.length > 0 && folder !== "starred" && (
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => onToggleSelectAll(displayedKeys)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
              )}
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
                title="Filter"
              >
                <Icons.Filter className="w-4 h-4" />
                {filter !== "all" && (
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                )}
              </Button>
              {showFilterMenu && (
                <div className="absolute right-0 top-6 mt-1.5 w-32 bg-background border border-border rounded-xl shadow-lg z-50 py-1.5 animate-in slide-in-from-top-1.5 fade-in duration-200">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setFilter("all");
                      setShowFilterMenu(false);
                    }}
                    className={`${FILTER_ITEM_BASE} ${
                      filter === "all"
                        ? FILTER_ITEM_ACTIVE
                        : FILTER_ITEM_INACTIVE
                    }`}
                  >
                    All Mail
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setFilter("read");
                      setShowFilterMenu(false);
                    }}
                    className={`${FILTER_ITEM_BASE} ${
                      filter === "read"
                        ? FILTER_ITEM_ACTIVE
                        : FILTER_ITEM_INACTIVE
                    }`}
                  >
                    Read
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setFilter("unread");
                      setShowFilterMenu(false);
                    }}
                    className={`${FILTER_ITEM_BASE} ${
                      filter === "unread"
                        ? FILTER_ITEM_ACTIVE
                        : FILTER_ITEM_INACTIVE
                    }`}
                  >
                    Unread
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {displayedThreads.length === 0 && (
          <div className="p-8 text-center text-text-muted text-[13px]">
            No emails in this folder.
          </div>
        )}

        {displayedThreads.map((thread) => {
          const isUnread = thread.hasUnread;
          const latest = thread.latestEmail;
          const senderName = latest.fromName || latest.fromAddress;
          // Show all unique senders if more than one person in the thread
          const uniqueSenders = [
            ...new Set(thread.emails.map((e) => e.fromName || e.fromAddress)),
          ];
          const senderDisplay =
            uniqueSenders.length > 1
              ? uniqueSenders.slice(0, 2).join(", ") +
                (uniqueSenders.length > 2
                  ? ` +${uniqueSenders.length - 2}`
                  : "")
              : senderName;
          const timeStr = formatEmailTime(latest.receivedAt);
          const isChecked = selectedKeys.includes(thread.threadKey);
          const isActive = thread.threadKey === activeKey;
          const latestEmailId = latest.id;

          return (
            <div
              key={thread.threadKey}
              className={`group relative flex items-center border-b border-border transition-colors hover:bg-surface-hover/80 ${
                isActive ? "bg-accent-subtle" : ""
              }`}
            >
              {/* Checkbox */}
              {folder !== "starred" && (
                <div className="pl-4 pr-1 flex items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect(thread.threadKey);
                    }}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                </div>
              )}

              {/* Row */}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `${basePath}?messageId=${latestEmailId}&threadKey=${encodeURIComponent(thread.threadKey)}`,
                  )
                }
                className={`flex-1 text-left py-3 ${
                  folder === "starred" ? "pl-4" : "pl-2"
                } pr-4 outline-none cursor-pointer relative min-w-0`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-2 pr-6 min-w-0">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    )}
                    <span
                      className={`text-[13px] truncate ${
                        isUnread
                          ? "font-semibold text-primary-text"
                          : "font-medium text-text-secondary"
                      }`}
                    >
                      {senderDisplay}
                    </span>
                    {thread.messageCount > 1 && (
                      <span className="text-[11px] text-text-muted bg-surface border border-border rounded-full px-1.5 py-0 shrink-0 leading-5">
                        {thread.messageCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted shrink-0 ml-2">
                    {timeStr}
                  </span>
                </div>

                <h3
                  className={`text-[14px] leading-snug truncate mb-1 pr-6 ${
                    isUnread
                      ? "font-semibold text-primary-text"
                      : "font-medium text-primary-text"
                  }`}
                >
                  {thread.subject}
                </h3>

                <p className="text-[13px] text-text-secondary leading-snug line-clamp-2">
                  {/* Show only the snippet of the latest email, stripped of quoting */}
                  {latest.bodyText
                    .split("\n")
                    .filter(
                      (line) => !line.startsWith(">") && line.trim() !== "",
                    )
                    .join(" ")
                    .slice(0, 160)}
                </p>
              </button>

              {/* Quick action */}
              {selectedKeys.length === 0 && (
                <div className="absolute right-4 top-2.5 z-10 flex items-center gap-1 shrink-0 bg-background dark:bg-background border border-border shadow-sm rounded-lg px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(folder === "inbox" || folder === "starred") &&
                    onTrashThread && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move to trash"
                        title="Move to trash"
                        className="h-6 w-6 text-text-muted hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrashThread(thread.emails.map((em) => em.id));
                        }}
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  {folder === "drafts" && onDeleteThread && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete draft permanently"
                      title="Delete permanently"
                      className="h-6 w-6 text-text-muted hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteThread(thread.emails.map((em) => em.id));
                      }}
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {folder === "trash" && (
                    <>
                      {onRestoreThread && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Restore to inbox"
                          title="Restore to inbox"
                          className="h-6 w-6 text-text-muted hover:text-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreThread(thread.emails.map((em) => em.id));
                          }}
                        >
                          <Icons.Rollback className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {onDeleteThread && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete permanently"
                          title="Delete permanently"
                          className="h-6 w-6 text-text-muted hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.emails.map((em) => em.id));
                          }}
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
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
