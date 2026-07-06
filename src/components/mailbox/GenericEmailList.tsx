"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { UI_EMAIL_LIMIT } from "@/lib/constants";
import type { EmailWithState } from "@/types";

export interface GenericEmailListProps {
  emails: EmailWithState[];
  selectedId?: string;
  folder: "inbox" | "trash" | "starred";
  onTrashEmail?: (id: string) => void;
  onRestoreEmail?: (id: string) => void;
  onDeleteEmail?: (id: string) => void;
  title: string;
  // Multi-select props
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (filteredIds: string[]) => void;
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

export function GenericEmailList({
  emails,
  selectedId,
  folder,
  onTrashEmail,
  onRestoreEmail,
  onDeleteEmail,
  title,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBulkTrash,
  onBulkRestore,
  onBulkDelete,
  onBulkRead,
  onBulkUnread,
}: GenericEmailListProps) {
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

  // Reset page when switching folders or search/emails list changes
  useEffect(() => {
    if (emails.length >= 0 || folder) {
      setPage(1);
    }
  }, [emails, folder]);

  const filteredEmails = emails.filter((email) => {
    if (filter === "read") return email.isRead;
    if (filter === "unread") return !email.isRead;
    return true;
  });

  const totalPages = Math.ceil(filteredEmails.length / UI_EMAIL_LIMIT);
  const displayedEmails = filteredEmails.slice(
    (page - 1) * UI_EMAIL_LIMIT,
    page * UI_EMAIL_LIMIT,
  );

  const activeId = selectedId ?? filteredEmails[0]?.id;
  const basePath =
    folder === "trash" ? "/trash" : folder === "starred" ? "/starred" : "/";
  const displayedIds = displayedEmails.map((e) => e.id);
  const areAllSelected =
    displayedIds.length > 0 &&
    displayedIds.every((id) => selectedIds.includes(id));

  return (
    <div className="w-full md:w-[360px] bg-background border-r border-border h-full flex flex-col shrink-0 select-none">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
        {selectedIds.length > 0 ? (
          <div className="flex items-center justify-between w-full animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={areAllSelected}
                onChange={() => onToggleSelectAll(displayedIds)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <span className="text-[13px] font-semibold text-primary-text">
                {selectedIds.length} selected
              </span>
            </div>
            <div className="flex items-center gap-1">
              {folder === "inbox" && (
                <>
                  {onBulkRead && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onBulkRead(selectedIds)}
                      title="Mark as read"
                    >
                      <Icons.Mail className="w-4 h-4 text-text-secondary" />
                    </Button>
                  )}
                  {onBulkUnread && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onBulkUnread(selectedIds)}
                      title="Mark as unread"
                    >
                      <Icons.Mail className="w-4 h-4 text-text-muted" />
                    </Button>
                  )}
                  {onBulkTrash && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onBulkTrash(selectedIds)}
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
                      onClick={() => onBulkRestore(selectedIds)}
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
                      onClick={() => onBulkDelete(selectedIds)}
                      title="Delete permanently"
                      className="hover:text-destructive"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {displayedEmails.length > 0 && folder !== "starred" && (
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => onToggleSelectAll(displayedIds)}
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
                title="Filter Emails"
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

      {/* Email List container */}
      <div className="flex-1 overflow-y-auto">
        {displayedEmails.length === 0 && (
          <div className="p-8 text-center text-text-muted text-[13px]">
            No emails in this folder.
          </div>
        )}

        {displayedEmails.map((email) => {
          const isUnread = !email.isRead;
          const senderName = email.fromName || email.fromAddress;
          const timeStr = formatEmailTime(email.receivedAt);
          const isChecked = selectedIds.includes(email.id);

          return (
            <div
              key={email.id}
              className={`group relative flex items-center border-b border-border transition-colors hover:bg-surface-hover/80 ${
                email.id === activeId ? "bg-accent-subtle" : ""
              }`}
            >
              {/* Checkbox Column */}
              {folder !== "starred" && (
                <div className="pl-4 pr-1 flex items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect(email.id);
                    }}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                </div>
              )}

              {/* Main row button area */}
              <button
                type="button"
                onClick={() => router.push(`${basePath}?messageId=${email.id}`)}
                className={`flex-1 text-left py-3 ${
                  folder === "starred" ? "pl-4" : "pl-2"
                } pr-4 outline-none cursor-pointer relative min-w-0`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-2 pr-6 min-w-0">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0"></span>
                    )}
                    <span
                      className={`text-[13px] truncate ${
                        isUnread
                          ? "font-semibold text-primary-text"
                          : "font-medium text-text-secondary"
                      }`}
                    >
                      {senderName}
                    </span>
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
                  {email.subject}
                </h3>

                <p className="text-[13px] text-text-secondary leading-snug line-clamp-2">
                  {email.bodyText}
                </p>
              </button>

              {/* Single row quick action */}
              {selectedIds.length === 0 && (
                <div className="absolute right-4 top-2.5 z-10 flex items-center gap-1 shrink-0 bg-background dark:bg-background border border-border shadow-sm rounded-lg px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(folder === "inbox" || folder === "starred") &&
                    onTrashEmail && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move to trash"
                        title="Move to trash"
                        className="h-6 w-6 text-text-muted hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrashEmail(email.id);
                        }}
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  {folder === "trash" && (
                    <>
                      {onRestoreEmail && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Restore to inbox"
                          title="Restore to inbox"
                          className="h-6 w-6 text-text-muted hover:text-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreEmail(email.id);
                          }}
                        >
                          <Icons.Rollback className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {onDeleteEmail && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete permanently"
                          title="Delete permanently"
                          className="h-6 w-6 text-text-muted hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEmail(email.id);
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

      {/* Paging Footer */}
      {totalPages > 1 && (
        <div className="h-12 border-t border-border px-4 flex items-center justify-between shrink-0 bg-surface/10">
          <Button
            variant="ghost"
            size="icon-sm"
            id="btn-prev-page"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="h-8 w-8 text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all active:scale-95"
            title="Previous Page"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
          </Button>

          <span
            id="page-indicator"
            className="text-[12px] font-medium text-text-secondary"
          >
            Page {page} of {totalPages}
          </span>

          <Button
            variant="ghost"
            size="icon-sm"
            id="btn-next-page"
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
