"use client";

import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";
import { Switch } from "@/components/ui/Switch";
import { useMeQuery } from "@/queries/useAuth";
import {
  useCreateMailboxAddressMutation,
  useDeleteMailboxAddressMutation,
  useMailboxAddressesQuery,
  useUpdateMailboxAddressMutation,
} from "@/queries/useMailboxAddresses";
import { useAppStore } from "@/store/useAppStore";
import type { MailboxAddress } from "@/types";

export default function MailboxesPage() {
  const t = useTranslations("Mailboxes");
  const { data: userData } = useMeQuery();
  const { addToast } = useAppStore();

  const userRole = userData?.role || "MEMBER";
  const isMember = userRole === "MEMBER";
  const isOwner = userRole === "OWNER";
  const _isAdmin = userRole === "ADMIN";

  // Fetch Mailboxes
  const { data, isLoading, error: queryError } = useMailboxAddressesQuery();
  const mailboxes = data?.mailboxes || [];

  // Mutations
  const createMutation = useCreateMailboxAddressMutation();
  const updateMutation = useUpdateMailboxAddressMutation();
  const deleteMutation = useDeleteMailboxAddressMutation();

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxAddress | null>(
    null,
  );
  const [addressInput, setAddressInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync input values when selectedMailbox changes (e.g. for Edit)
  useEffect(() => {
    if (selectedMailbox) {
      setAddressInput(selectedMailbox.address);
      setDisplayNameInput(selectedMailbox.displayName || "");
      setIsActiveInput(selectedMailbox.isActive);
    } else {
      setAddressInput("");
      setDisplayNameInput("");
      setIsActiveInput(true);
    }
  }, [selectedMailbox]);

  const handleOpenAdd = () => {
    if (isMember) return;
    setSelectedMailbox(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (mailbox: MailboxAddress) => {
    if (isMember) return;
    setSelectedMailbox(mailbox);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMailbox(null);
    setFormError(null);
  };

  const handleToggleActive = async (mailbox: MailboxAddress) => {
    if (isMember) return;
    try {
      await updateMutation.mutateAsync({
        id: mailbox.id,
        isActive: !mailbox.isActive,
      });
      addToast(t("toasts.updateSuccess"), "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : t("toasts.toggleStatusError"),
        "error",
      );
    }
  };

  const handleDelete = async (mailbox: MailboxAddress) => {
    if (isMember) return;

    // For OWNER it's a hard delete. For ADMIN it's a soft delete/deactivate.
    const message = isOwner
      ? t("confirmDelete")
      : t("confirmDeactivate");
    if (!window.confirm(message)) return;

    try {
      await deleteMutation.mutateAsync(mailbox.id);
      addToast(t("toasts.deleteSuccess"), "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : t("toasts.deleteError"),
        "error",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (selectedMailbox) {
        await updateMutation.mutateAsync({
          id: selectedMailbox.id,
          address: addressInput,
          displayName: displayNameInput,
          isActive: isActiveInput,
        });
        addToast(t("toasts.updateSuccess"), "success");
      } else {
        await createMutation.mutateAsync({
          address: addressInput,
          displayName: displayNameInput,
          isActive: isActiveInput,
        });
        addToast(t("toasts.createSuccess"), "success");
      }
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-text-secondary text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface/35 text-text-primary px-4 py-5 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="flex w-full flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1 py-1">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {t("title")}
            </h1>
            <p className="text-[13px] text-text-secondary">{t("subtitle")}</p>
          </div>
          {!isMember && (
            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 rounded-md font-semibold text-[13px] w-fit flex items-center gap-1.5"
            >
              <Icons.Add className="w-4 h-4" />
              <span>{t("addMailbox")}</span>
            </Button>
          )}
        </div>

        {/* Read-Only Warning Banner */}
        {isMember && (
          <div className="px-1">
            <FeedbackBanner type="warning" message={t("readOnlyWarning")} />
          </div>
        )}

        {/* Error Banner */}
        {queryError && (
          <div className="px-1">
            <FeedbackBanner
              type="error"
              message={
                queryError instanceof Error
                  ? queryError.message
                  : "Failed to load mailboxes"
              }
            />
          </div>
        )}

        {/* Mailbox List */}
        <div className="w-full bg-surface border border-border rounded-xl overflow-hidden">
          {mailboxes.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-text-secondary">
              {t("noMailboxes")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px] text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50 text-[11px] font-semibold text-text-secondary uppercase tracking-wider select-none">
                    <th className="px-6 py-3">{t("displayName")}</th>
                    <th className="px-6 py-3">{t("emailAddress")}</th>
                    <th className="px-6 py-3 w-[120px]">{t("status")}</th>
                    <th className="px-6 py-3 w-[150px]">{t("created")}</th>
                    {!isMember && (
                      <th className="px-6 py-3 w-[120px] text-right">
                        {t("actions")}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mailboxes.map((mailbox) => (
                    <tr
                      key={mailbox.id}
                      className="hover:bg-surface-hover/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-text-primary">
                        {mailbox.displayName || (
                          <span className="text-text-muted italic">
                            {t("noName")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-mono">
                        {mailbox.address}
                      </td>
                      <td className="px-6 py-4">
                        {isMember ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              mailbox.isActive
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {mailbox.isActive ? t("active") : t("inactive")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(mailbox)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all hover:opacity-80 cursor-pointer ${
                              mailbox.isActive
                                ? "bg-success/15 text-success border border-success/30"
                                : "bg-destructive/15 text-destructive border border-destructive/30"
                            }`}
                          >
                            {mailbox.isActive ? t("active") : t("inactive")}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(mailbox.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      {!isMember && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleOpenEdit(mailbox)}
                              title={t("editMailbox")}
                            >
                              <Icons.Settings className="w-3.5 h-3.5 text-text-secondary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDelete(mailbox)}
                              title={t("delete")}
                              className="hover:text-destructive text-text-secondary"
                            >
                              <Icons.Trash className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Form Overlay */}
        <Dialog
          isOpen={showModal}
          onClose={handleCloseModal}
          title={selectedMailbox ? t("editMailbox") : t("addMailbox")}
        >
          {/* Form body */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formError && <FeedbackBanner type="error" message={formError} />}

            <FormField
              id="displayName"
              name="displayName"
              label={t("displayName")}
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="e.g. Support Inbox"
              autoComplete="off"
            />

            <FormField
              id="address"
              name="address"
              type="email"
              label={t("emailAddress")}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="e.g. support@yourdomain.com"
              required
              disabled={!!selectedMailbox} // Disable address edits for existing mailboxes
            />

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[12.5px] font-semibold text-text-primary">
                  {t("status")}
                </span>
                <p className="text-[11.5px] text-text-secondary">
                  {t("statusDesc")}
                </p>
              </div>

              {/* Status Toggle Switch */}
              <Switch checked={isActiveInput} onChange={setIsActiveInput} />
            </div>

            {/* Form Actions Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="h-8.5 text-[12px] px-3 font-medium"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-8.5 text-[12px] px-4 font-semibold"
              >
                {isSubmitting ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </div>
  );
}
