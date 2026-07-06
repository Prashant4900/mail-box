"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import type { EmailWithState } from "@/types";
import { GenericEmailList } from "./GenericEmailList";
import { GenericReadingPane } from "./GenericReadingPane";

export interface MailboxLayoutProps {
  emails: EmailWithState[];
  isLoading: boolean;
  isError: boolean;
  selectedId: string | undefined;
  folder: "inbox" | "trash" | "starred";
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
  // Bulk action props
  onBulkTrash?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRead?: (ids: string[]) => void;
  onBulkUnread?: (ids: string[]) => void;
}

export function MailboxLayout({
  emails,
  isLoading,
  isError,
  selectedId,
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
}: MailboxLayoutProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Clear selections when switching folder views
  useEffect(() => {
    setSelectedIds([]);
  }, []);

  // Determine active single selected ID (fallback if multi-select isn't active)
  const activeId =
    selectedIds.length === 1 ? selectedIds[0] : selectedId || emails[0]?.id;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = (filteredIds: string[]) => {
    setSelectedIds((prev) => {
      const areAllSelected = filteredIds.every((id) => prev.includes(id));
      if (areAllSelected) {
        // Deselect all filtered IDs
        return prev.filter((id) => !filteredIds.includes(id));
      }
      // Add all filtered IDs that are not already selected
      const newSelection = [...prev];
      for (const id of filteredIds) {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      }
      return newSelection;
    });
  };

  const handleBulkTrash = (ids: string[]) => {
    if (onBulkTrash) {
      onBulkTrash(ids);
      setSelectedIds([]);
    }
  };

  const handleBulkRestore = (ids: string[]) => {
    if (onBulkRestore) {
      onBulkRestore(ids);
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = (ids: string[]) => {
    if (onBulkDelete) {
      onBulkDelete(ids);
      setSelectedIds([]);
    }
  };

  const handleBulkRead = (ids: string[]) => {
    if (onBulkRead) {
      onBulkRead(ids);
      setSelectedIds([]);
    }
  };

  const handleBulkUnread = (ids: string[]) => {
    if (onBulkUnread) {
      onBulkUnread(ids);
      setSelectedIds([]);
    }
  };

  const handleSingleTrash = (id: string) => {
    if (onTrashEmail) {
      onTrashEmail(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSingleRestore = (id: string) => {
    if (onRestoreEmail) {
      onRestoreEmail(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSingleDelete = (id: string) => {
    if (onDeleteEmail) {
      onDeleteEmail(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Handle loading skeleton
  if (isLoading) {
    return (
      <div className="flex h-full w-full overflow-hidden">
        {/* List skeleton */}
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
        {/* Reading pane skeleton */}
        <div className="hidden md:flex flex-1 flex-col h-full bg-background">
          <div className="h-14 flex items-center px-6 border-b border-border shrink-0">
            <div className="h-4 w-32 bg-surface-hover rounded animate-pulse" />
          </div>
          <div className="flex-1 p-8 space-y-6 max-w-3xl mx-auto w-full">
            <div className="h-8 w-2/3 bg-surface-hover rounded animate-pulse" />
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 bg-surface-hover rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-surface-hover rounded" />
                <div className="h-3 w-1/4 bg-surface-hover rounded" />
              </div>
            </div>
            <div className="space-y-3 pt-4 animate-pulse">
              <div className="h-4 w-full bg-surface-hover rounded" />
              <div className="h-4 w-full bg-surface-hover rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
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

  // Handle completely empty list state
  if (emails.length === 0) {
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
      {/* List Pane - hidden on mobile when a message is active */}
      <div
        className={`h-full shrink-0 md:w-[360px] ${
          selectedId ? "hidden md:block" : "w-full"
        }`}
      >
        <GenericEmailList
          emails={emails}
          selectedId={selectedId}
          folder={folder}
          onTrashEmail={handleSingleTrash}
          onRestoreEmail={handleSingleRestore}
          onDeleteEmail={handleSingleDelete}
          title={title}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onBulkTrash={handleBulkTrash}
          onBulkRestore={handleBulkRestore}
          onBulkDelete={handleBulkDelete}
          onBulkRead={handleBulkRead}
          onBulkUnread={handleBulkUnread}
        />
      </div>

      {/* Reading Pane - visible on mobile only when a message is active */}
      <div
        className={`h-full flex-1 min-w-0 ${
          selectedId ? "block" : "hidden md:block"
        }`}
      >
        {selectedIds.length > 1 ? (
          /* Premium multi-select visual dashboard */
          <div className="flex-1 bg-background h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
            <div className="max-w-md space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-accent-subtle/50 flex items-center justify-center border border-accent/20 text-accent">
                <Icons.Mail className="w-6 h-6 animate-bounce duration-1000" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary-text mb-1">
                  {selectedIds.length} conversations selected
                </h3>
                <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed">
                  Apply a bulk action from the list header toolbar to update
                  these conversations simultaneously.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <GenericReadingPane
            messageId={activeId}
            folder={folder}
            onTrashEmail={handleSingleTrash}
            onRestoreEmail={handleSingleRestore}
            onDeleteEmail={handleSingleDelete}
            onReadEmail={onReadEmail}
            onUnreadEmail={onUnreadEmail}
            onStarEmail={onStarEmail}
            onUnstarEmail={onUnstarEmail}
          />
        )}
      </div>
    </div>
  );
}
