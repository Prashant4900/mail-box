"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import type { EmailThread } from "@/types";
import { ThreadEmailList } from "./ThreadEmailList";
import { ThreadReadingPane } from "./ThreadReadingPane";

export interface ThreadMailboxLayoutProps {
  threads: EmailThread[];
  isLoading: boolean;
  isError: boolean;
  selectedThreadKey?: string;
  folder: "inbox" | "trash" | "starred" | "drafts";
  onTrashEmail?: (id: string) => void;
  onRestoreEmail?: (id: string) => void;
  onDeleteEmail?: (id: string) => void;
  onReadEmail?: (id: string) => void;
  onUnreadEmail?: (id: string) => void;
  onStarEmail?: (id: string) => void;
  onUnstarEmail?: (id: string) => void;
  title: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateIcon: React.ReactNode;
  // Bulk actions (operate on individual email IDs, not thread keys)
  onBulkTrash?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRead?: (ids: string[]) => void;
  onBulkUnread?: (ids: string[]) => void;
}

export function ThreadMailboxLayout({
  threads,
  isLoading,
  isError,
  selectedThreadKey,
  folder,
  onTrashEmail,
  onRestoreEmail,
  onDeleteEmail,
  onReadEmail,
  onUnreadEmail,
  onStarEmail,
  onUnstarEmail,
  title,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateIcon,
  onBulkTrash,
  onBulkRestore,
  onBulkDelete,
  onBulkRead,
  onBulkUnread,
}: ThreadMailboxLayoutProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    setSelectedKeys([]);
  }, []);

  const activeKey = selectedThreadKey ?? threads[0]?.threadKey;
  const activeThread = threads.find((t) => t.threadKey === activeKey);

  const handleToggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleToggleSelectAll = (filteredKeys: string[]) => {
    setSelectedKeys((prev) => {
      const areAllSelected = filteredKeys.every((k) => prev.includes(k));
      if (areAllSelected) {
        return prev.filter((k) => !filteredKeys.includes(k));
      }
      const next = [...prev];
      for (const k of filteredKeys) {
        if (!next.includes(k)) next.push(k);
      }
      return next;
    });
  };

  const _idsForKeys = (keys: string[]): string[] => {
    const ids: string[] = [];
    for (const thread of threads) {
      if (keys.includes(thread.threadKey)) {
        for (const email of thread.emails) {
          ids.push(email.id);
        }
      }
    }
    return ids;
  };

  const handleBulkTrash = (ids: string[]) => {
    onBulkTrash?.(ids);
    setSelectedKeys([]);
  };
  const handleBulkRestore = (ids: string[]) => {
    onBulkRestore?.(ids);
    setSelectedKeys([]);
  };
  const handleBulkDelete = (ids: string[]) => {
    onBulkDelete?.(ids);
    setSelectedKeys([]);
  };
  const handleBulkRead = (ids: string[]) => {
    onBulkRead?.(ids);
    setSelectedKeys([]);
  };
  const handleBulkUnread = (ids: string[]) => {
    onBulkUnread?.(ids);
    setSelectedKeys([]);
  };

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
            Failed to load emails
          </div>
          <p className="text-text-secondary text-[13px]">
            Please check your connection and reload the page.
          </p>
        </div>
      </div>
    );
  }

  if (threads.length === 0) {
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
      {/* List pane — hidden on mobile when a thread is active */}
      <div
        className={`h-full shrink-0 md:w-[360px] ${
          selectedThreadKey ? "hidden md:block" : "w-full"
        }`}
      >
        <ThreadEmailList
          threads={threads}
          selectedThreadKey={activeKey}
          folder={folder}
          onTrashThread={(ids) =>
            ids.forEach((id) => {
              onTrashEmail?.(id);
            })
          }
          onRestoreThread={(ids) =>
            ids.forEach((id) => {
              onRestoreEmail?.(id);
            })
          }
          onDeleteThread={(ids) =>
            ids.forEach((id) => {
              onDeleteEmail?.(id);
            })
          }
          title={title}
          selectedKeys={selectedKeys}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onBulkTrash={handleBulkTrash}
          onBulkRestore={handleBulkRestore}
          onBulkDelete={handleBulkDelete}
          onBulkRead={handleBulkRead}
          onBulkUnread={handleBulkUnread}
        />
      </div>

      {/* Reading pane */}
      <div
        className={`h-full flex-1 min-w-0 ${
          selectedThreadKey ? "block" : "hidden md:block"
        }`}
      >
        {selectedKeys.length > 1 ? (
          <div className="flex-1 bg-background h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
            <div className="max-w-md space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-accent-subtle/50 flex items-center justify-center border border-accent/20 text-accent">
                <Icons.Mail className="w-6 h-6 animate-bounce duration-1000" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-text mb-1">
                  {selectedKeys.length} conversations selected
                </h3>
                <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed">
                  Apply a bulk action from the list header toolbar to update
                  these conversations simultaneously.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ThreadReadingPane
            thread={activeThread}
            folder={folder}
            onTrashEmail={onTrashEmail}
            onRestoreEmail={onRestoreEmail}
            onDeleteEmail={onDeleteEmail}
            onReadEmail={onReadEmail}
            onUnreadEmail={onUnreadEmail}
            onStarEmail={onStarEmail}
            onUnstarEmail={onUnstarEmail}
            onBulkTrash={onBulkTrash}
            onBulkRestore={onBulkRestore}
            onBulkDelete={onBulkDelete}
          />
        )}
      </div>
    </div>
  );
}
