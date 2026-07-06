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

function MailboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadKey = searchParams.get("threadKey") ?? undefined;
  const searchQuery = searchParams.get("search") || undefined;

  const t = useTranslations("Sidebar");
  const tInbox = useTranslations("Inbox");
  const { addToast } = useAppStore();

  const [pendingTrashIds, setPendingTrashIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useThreadsQuery({
    trashed: false,
    search: searchQuery,
  });

  const threads = data?.threads || [];

  const updateEmail = useUpdateEmailMutation();
  const bulkUpdateEmail = useBulkUpdateEmailsMutation();

  const handleTrash = (id: string) => {
    setPendingTrashIds([id]);
  };

  const handleBulkTrash = (ids: string[]) => {
    setPendingTrashIds(ids);
  };

  const executeTrash = (ids: string[]) => {
    bulkUpdateEmail.mutate(
      { ids, action: "trash" },
      {
        onSuccess: () => {
          const count = ids.length;
          addToast(
            count > 1
              ? tInbox("bulkTrashSuccess", { count })
              : tInbox("trashSuccess"),
            "success",
          );
          // If the active thread contained a trashed message, deselect it
          if (threadKey) {
            const activeThread = threads.find((t) => t.threadKey === threadKey);
            if (activeThread?.emails.some((e) => ids.includes(e.id))) {
              router.push("/");
            }
          }
        },
        onError: () => addToast(tInbox("trashError"), "error"),
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
        onSuccess: () => addToast(tInbox("unreadSuccess"), "success"),
        onError: () => addToast(tInbox("unreadError"), "error"),
      },
    );
  };

  const handleStar = (id: string) => {
    updateEmail.mutate(
      { id, action: "save" },
      {
        onSuccess: () => addToast(tInbox("starSuccess"), "success"),
        onError: () => addToast(tInbox("starError"), "error"),
      },
    );
  };

  const handleUnstar = (id: string) => {
    updateEmail.mutate(
      { id, action: "unsave" },
      {
        onSuccess: () => addToast(tInbox("unstarSuccess"), "success"),
        onError: () => addToast(tInbox("unstarError"), "error"),
      },
    );
  };

  const handleBulkRead = (ids: string[]) => {
    bulkUpdateEmail.mutate(
      { ids, action: "read" },
      {
        onSuccess: () => addToast(tInbox("bulkReadSuccess"), "success"),
        onError: () => addToast(tInbox("bulkReadError"), "error"),
      },
    );
  };

  const handleBulkUnread = (ids: string[]) => {
    bulkUpdateEmail.mutate(
      { ids, action: "unread" },
      {
        onSuccess: () => addToast(tInbox("bulkUnreadSuccess"), "success"),
        onError: () => addToast(tInbox("bulkUnreadError"), "error"),
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
        folder="inbox"
        onTrashEmail={handleTrash}
        onReadEmail={handleRead}
        onUnreadEmail={handleUnread}
        onStarEmail={handleStar}
        onUnstarEmail={handleUnstar}
        onBulkTrash={handleBulkTrash}
        onBulkRead={handleBulkRead}
        onBulkUnread={handleBulkUnread}
        title={t("inbox")}
        emptyStateTitle={tInbox("emptyStateTitle")}
        emptyStateDescription={tInbox("emptyStateDescription")}
        emptyStateIcon={<Icons.Mail className="w-7 h-7 text-text-muted" />}
      />

      <ConfirmationDialog
        isOpen={pendingTrashIds.length > 0}
        title={
          pendingTrashIds.length > 1
            ? tInbox("dialogTitleBulk")
            : tInbox("dialogTitleSingle")
        }
        message={
          pendingTrashIds.length > 1
            ? tInbox("dialogMessageBulk", { count: pendingTrashIds.length })
            : tInbox("dialogMessageSingle")
        }
        confirmLabel={tInbox("confirmLabel")}
        cancelLabel={tInbox("cancelLabel")}
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

export default function Home() {
  const tInbox = useTranslations("Inbox");

  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background text-text-secondary text-sm">
          {tInbox("loading")}
        </div>
      }
    >
      <MailboxContent />
    </Suspense>
  );
}
