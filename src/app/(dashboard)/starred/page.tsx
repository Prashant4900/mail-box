"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Icons } from "@/components/icons";
import { ThreadMailboxLayout } from "@/components/mailbox/ThreadMailboxLayout";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  useBulkUpdateEmailsMutation,
  useThreadsQuery,
  useUpdateEmailMutation,
} from "@/queries/useEmails";
import { useAppStore } from "@/store/useAppStore";

function StarredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadKey = searchParams.get("threadKey") ?? undefined;
  const searchQuery = searchParams.get("search") || undefined;

  const t = useTranslations("Sidebar");
  const tStarred = useTranslations("Starred");
  const { addToast } = useAppStore();

  const [pendingTrashIds, setPendingTrashIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useThreadsQuery({
    starred: true,
    search: searchQuery,
  });

  const threads = data?.threads || [];

  const updateEmail = useUpdateEmailMutation();
  const bulkUpdateEmail = useBulkUpdateEmailsMutation();

  const handleTrash = (id: string) => {
    setPendingTrashIds([id]);
  };

  const executeTrash = (ids: string[]) => {
    bulkUpdateEmail.mutate(
      { ids, action: "trash" },
      {
        onSuccess: () => {
          addToast(tStarred("trashSuccess"), "success");
          if (threadKey) {
            const active = threads.find((t) => t.threadKey === threadKey);
            if (active?.emails.some((e) => ids.includes(e.id))) {
              router.push("/starred");
            }
          }
        },
        onError: () => addToast(tStarred("trashError"), "error"),
      },
    );
  };

  const handleRead = (id: string) => {
    updateEmail.mutate({ id, action: "read" });
  };

  const handleUnread = (id: string) => {
    updateEmail.mutate(
      { id, action: "unread" },
      {
        onSuccess: () => addToast(tStarred("unreadSuccess"), "success"),
        onError: () => addToast(tStarred("unreadError"), "error"),
      },
    );
  };

  const handleStar = (id: string) => {
    updateEmail.mutate(
      { id, action: "save" },
      {
        onSuccess: () => addToast(tStarred("starSuccess"), "success"),
        onError: () => addToast(tStarred("starError"), "error"),
      },
    );
  };

  const handleUnstar = (id: string) => {
    updateEmail.mutate(
      { id, action: "unsave" },
      {
        onSuccess: () => {
          addToast(tStarred("unstarSuccess"), "success");
          if (threadKey) {
            const active = threads.find((t) => t.threadKey === threadKey);
            if (active?.emails.some((e) => e.id === id)) {
              router.push("/starred");
            }
          }
        },
        onError: () => addToast(tStarred("unstarError"), "error"),
      },
    );
  };

  return (
    <>
      <ThreadMailboxLayout
        threads={threads}
        isLoading={isLoading}
        isError={isError}
        selectedThreadKey={threadKey}
        folder="starred"
        onTrashEmail={handleTrash}
        onReadEmail={handleRead}
        onUnreadEmail={handleUnread}
        onStarEmail={handleStar}
        onUnstarEmail={handleUnstar}
        title={t("starred")}
        emptyStateTitle={tStarred("emptyStateTitle")}
        emptyStateDescription={tStarred("emptyStateDescription")}
        emptyStateIcon={<Icons.Star className="w-7 h-7 text-text-muted" />}
      />

      <ConfirmationDialog
        isOpen={pendingTrashIds.length > 0}
        title={tStarred("dialogTitle")}
        message={tStarred("dialogMessage")}
        confirmLabel={tStarred("confirmLabel")}
        cancelLabel={tStarred("cancelLabel")}
        variant="destructive"
        onConfirm={() => {
          if (pendingTrashIds.length > 0) {
            executeTrash(pendingTrashIds);
            setPendingTrashIds([]);
          }
        }}
        onCancel={() => setPendingTrashIds([])}
      />
    </>
  );
}

export default function StarredPage() {
  const tStarred = useTranslations("Starred");

  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background text-text-secondary text-sm">
          {tStarred("loading")}
        </div>
      }
    >
      <StarredContent />
    </Suspense>
  );
}
