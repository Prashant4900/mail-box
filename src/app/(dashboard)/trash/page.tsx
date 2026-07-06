"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Icons } from "@/components/icons";
import { ThreadMailboxLayout } from "@/components/mailbox/ThreadMailboxLayout";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  useBulkDeleteEmailsMutation,
  useBulkUpdateEmailsMutation,
  useThreadsQuery,
} from "@/queries/useEmails";
import { useAppStore } from "@/store/useAppStore";

function TrashContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadKey = searchParams.get("threadKey") ?? undefined;
  const searchQuery = searchParams.get("search") || undefined;

  const t = useTranslations("Sidebar");
  const tTrash = useTranslations("Trash");
  const { addToast } = useAppStore();

  const [pendingRestoreIds, setPendingRestoreIds] = useState<string[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useThreadsQuery({
    trashed: true,
    search: searchQuery,
  });

  const threads = data?.threads || [];

  const bulkUpdateEmail = useBulkUpdateEmailsMutation();
  const bulkDeleteEmail = useBulkDeleteEmailsMutation();

  const handleRestore = (id: string) => {
    setPendingRestoreIds([id]);
  };

  const handleBulkRestore = (ids: string[]) => {
    setPendingRestoreIds(ids);
  };

  const handleDeletePermanently = (id: string) => {
    setPendingDeleteIds([id]);
  };

  const handleBulkDelete = (ids: string[]) => {
    setPendingDeleteIds(ids);
  };

  const executeRestore = (ids: string[]) => {
    bulkUpdateEmail.mutate(
      { ids, action: "restore" },
      {
        onSuccess: () => {
          const count = ids.length;
          addToast(
            count > 1
              ? tTrash("bulkRestoreSuccess", { count })
              : tTrash("restoreSuccess"),
            "success",
          );
          if (threadKey) {
            const active = threads.find((t) => t.threadKey === threadKey);
            if (active?.emails.some((e) => ids.includes(e.id))) {
              router.push("/trash");
            }
          }
        },
        onError: () => addToast(tTrash("restoreError"), "error"),
      },
    );
  };

  const executeDelete = (ids: string[]) => {
    bulkDeleteEmail.mutate(
      { ids },
      {
        onSuccess: () => {
          const count = ids.length;
          addToast(
            count > 1
              ? tTrash("bulkDeleteSuccess", { count })
              : tTrash("deleteSuccess"),
            "success",
          );
          if (threadKey) {
            const active = threads.find((t) => t.threadKey === threadKey);
            if (active?.emails.some((e) => ids.includes(e.id))) {
              router.push("/trash");
            }
          }
        },
        onError: () => addToast(tTrash("deleteError"), "error"),
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
        folder="trash"
        onRestoreEmail={handleRestore}
        onDeleteEmail={handleDeletePermanently}
        onBulkRestore={handleBulkRestore}
        onBulkDelete={handleBulkDelete}
        title={t("trash")}
        emptyStateTitle={tTrash("emptyStateTitle")}
        emptyStateDescription={tTrash("emptyStateDescription")}
        emptyStateIcon={<Icons.Trash className="w-7 h-7 text-text-muted" />}
      />

      <ConfirmationDialog
        isOpen={pendingRestoreIds.length > 0}
        title={
          pendingRestoreIds.length > 1
            ? tTrash("dialogRestoreTitleBulk")
            : tTrash("dialogRestoreTitleSingle")
        }
        message={
          pendingRestoreIds.length > 1
            ? tTrash("dialogRestoreMessageBulk", { count: pendingRestoreIds.length })
            : tTrash("dialogRestoreMessageSingle")
        }
        confirmLabel={tTrash("confirmRestoreLabel")}
        cancelLabel={tTrash("cancelLabel")}
        onConfirm={() => {
          if (pendingRestoreIds.length > 0) {
            executeRestore(pendingRestoreIds);
            setPendingRestoreIds([]);
          }
        }}
        onCancel={() => setPendingRestoreIds([])}
      />

      <ConfirmationDialog
        isOpen={pendingDeleteIds.length > 0}
        title={
          pendingDeleteIds.length > 1
            ? tTrash("dialogDeleteTitleBulk")
            : tTrash("dialogDeleteTitleSingle")
        }
        message={
          pendingDeleteIds.length > 1
            ? tTrash("dialogDeleteMessageBulk", { count: pendingDeleteIds.length })
            : tTrash("dialogDeleteMessageSingle")
        }
        confirmLabel={tTrash("confirmDeleteLabel")}
        cancelLabel={tTrash("cancelLabel")}
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteIds.length > 0) {
            executeDelete(pendingDeleteIds);
            setPendingDeleteIds([]);
          }
        }}
        onCancel={() => setPendingDeleteIds([])}
      />
    </>
  );
}

export default function TrashPage() {
  const tTrash = useTranslations("Trash");

  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background text-text-secondary text-sm">
          {tTrash("loading")}
        </div>
      }
    >
      <TrashContent />
    </Suspense>
  );
}
