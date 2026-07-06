"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Icons } from "@/components/icons";
import { ThreadMailboxLayout } from "@/components/mailbox/ThreadMailboxLayout";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useDeleteDraftMutation, useDraftsQuery } from "@/queries/useEmails";
import { useAppStore } from "@/store/useAppStore";

function DraftsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadKey = searchParams.get("threadKey") ?? undefined;

  const t = useTranslations("Sidebar");
  const tDrafts = useTranslations("Drafts");
  const { addToast } = useAppStore();

  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const { data: threads, isLoading, isError } = useDraftsQuery();
  const deleteDraft = useDeleteDraftMutation();

  const handleDelete = (id: string) => {
    setPendingDeleteIds([id]);
  };

  const handleBulkDelete = (ids: string[]) => {
    setPendingDeleteIds(ids);
  };

  const executeDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => deleteDraft.mutateAsync(id)));
      const count = ids.length;
      addToast(
        count > 1
          ? tDrafts("bulkDeleteSuccess", { count })
          : tDrafts("deleteSuccess"),
        "success",
      );
      if (threadKey) {
        const activeThread = threads?.find((t) => t.threadKey === threadKey);
        if (activeThread?.emails.some((e) => ids.includes(e.id))) {
          router.push("/drafts");
        }
      }
    } catch (_err) {
      addToast(tDrafts("deleteError"), "error");
    }
  };

  return (
    <>
      <ThreadMailboxLayout
        threads={threads || []}
        isLoading={isLoading}
        isError={isError}
        selectedThreadKey={threadKey}
        folder="drafts"
        onTrashEmail={handleDelete} // Delete completely
        onDeleteEmail={handleDelete}
        onBulkTrash={handleBulkDelete}
        onBulkDelete={handleBulkDelete}
        title={t("drafts")}
        emptyStateTitle={tDrafts("emptyStateTitle")}
        emptyStateDescription={tDrafts("emptyStateDescription")}
        emptyStateIcon={<Icons.Drafts className="w-7 h-7 text-text-muted" />}
      />

      <ConfirmationDialog
        isOpen={pendingDeleteIds.length > 0}
        title={
          pendingDeleteIds.length > 1
            ? tDrafts("dialogTitleBulk")
            : tDrafts("dialogTitleSingle")
        }
        message={
          pendingDeleteIds.length > 1
            ? tDrafts("dialogMessageBulk", { count: pendingDeleteIds.length })
            : tDrafts("dialogMessageSingle")
        }
        confirmLabel={tDrafts("confirmLabel")}
        cancelLabel={tDrafts("cancelLabel")}
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

export default function DraftsPage() {
  const tDrafts = useTranslations("Drafts");

  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-background text-text-secondary text-sm">
          {tDrafts("loading")}
        </div>
      }
    >
      <DraftsContent />
    </Suspense>
  );
}
