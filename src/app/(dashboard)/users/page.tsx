"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Dialog } from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { FormField } from "@/components/ui/FormField";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useMeQuery } from "@/queries/useAuth";
import { useMailboxAddressesQuery } from "@/queries/useMailboxAddresses";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/queries/useUsers";
import { useAppStore } from "@/store/useAppStore";
import type { User, UserRole } from "@/types";

export default function UsersPage() {
  const router = useRouter();
  const t = useTranslations("Users");
  const { data: userData } = useMeQuery();
  const { addToast } = useAppStore();

  const userRole = userData?.role || "MEMBER";
  const isMember = userRole === "MEMBER";
  const isOwner = userRole === "OWNER";
  const isAdmin = userRole === "ADMIN";

  const canEditUser = (targetUser: User) => {
    if (isOwner) return true;
    if (isAdmin)
      return targetUser.role === "MEMBER" || targetUser.id === userData?.id;
    return false;
  };

  const canDeleteUser = (targetUser: User) => {
    if (targetUser.role === "OWNER") return false;
    if (targetUser.id === userData?.id) return false;
    if (isOwner) return true;
    if (isAdmin) return targetUser.role === "MEMBER";
    return false;
  };

  const canToggleBan = (targetUser: User) => {
    if (targetUser.role === "OWNER") return false;
    if (targetUser.id === userData?.id) return false;
    if (isOwner) return true;
    if (isAdmin) return targetUser.role === "MEMBER";
    return false;
  };

  // Redirect members away from this page entirely
  useEffect(() => {
    if (userData && isMember) {
      router.push("/");
    }
  }, [userData, isMember, router]);

  const { data, isLoading, error: queryError } = useUsersQuery();
  const users = data?.users || [];

  const { data: mailboxesData, isLoading: isLoadingMailboxes } =
    useMailboxAddressesQuery();
  const mailboxes = mailboxesData?.mailboxes || [];

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  // Modal & form state
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<UserRole>("MEMBER");
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [mailboxAddressIdsInput, setMailboxAddressIdsInput] = useState<
    string[]
  >([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation dialogs
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [userToToggleBan, setUserToToggleBan] = useState<User | null>(null);

  // Sync form inputs with selectedUser
  useEffect(() => {
    if (selectedUser) {
      setFirstNameInput(selectedUser.firstName);
      setLastNameInput(selectedUser.lastName);
      setEmailInput(selectedUser.email);
      setRoleInput(selectedUser.role);
      setIsActiveInput(selectedUser.isActive);
      setMailboxAddressIdsInput(
        selectedUser.mailboxAccess?.map(
          (ma: { mailboxAddressId: string }) => ma.mailboxAddressId,
        ) || [],
      );
    } else {
      setFirstNameInput("");
      setLastNameInput("");
      setEmailInput("");
      setRoleInput("MEMBER");
      setIsActiveInput(true);
      setMailboxAddressIdsInput([]);
    }
  }, [selectedUser]);

  if (isMember) {
    return null;
  }

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    if (!canEditUser(user)) return;
    setSelectedUser(user);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormError(null);
  };

  const handleToggleBan = (user: User) => {
    if (!canToggleBan(user)) return;
    setUserToToggleBan(user);
    setIsStatusConfirmOpen(true);
  };

  const handleConfirmToggleBan = async () => {
    if (!userToToggleBan) return;
    try {
      await updateMutation.mutateAsync({
        id: userToToggleBan.id,
        isBanned: !userToToggleBan.isBanned,
      });
      addToast(
        userToToggleBan.isBanned
          ? t("toasts.unbanSuccess")
          : t("toasts.banSuccess"),
        "success",
      );
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : t("toasts.banError"),
        "error",
      );
    } finally {
      setIsStatusConfirmOpen(false);
      setUserToToggleBan(null);
    }
  };

  const handleDelete = (user: User) => {
    if (!canDeleteUser(user)) return;
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      addToast(t("toasts.deleteSuccess"), "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : t("toasts.deleteError"),
        "error",
      );
    } finally {
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!firstNameInput || !lastNameInput || !emailInput) {
      setFormError(t("allFieldsRequired"));
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedUser) {
        await updateMutation.mutateAsync({
          id: selectedUser.id,
          firstName: firstNameInput,
          lastName: lastNameInput,
          email: emailInput,
          role: roleInput,
          isActive: isActiveInput,
          mailboxAddressIds: mailboxAddressIdsInput,
        });
        addToast(t("toasts.updateSuccess"), "success");
      } else {
        await createMutation.mutateAsync({
          firstName: firstNameInput,
          lastName: lastNameInput,
          email: emailInput,
          role: roleInput,
          isActive: isActiveInput,
          mailboxAddressIds: mailboxAddressIdsInput,
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
          <Button
            onClick={handleOpenAdd}
            className="h-9 px-4 rounded-md font-semibold text-[13px] w-fit flex items-center gap-1.5"
          >
            <Icons.Add className="w-4 h-4" />
            <span>{t("addUser")}</span>
          </Button>
        </div>

        {/* Query Error Banner */}
        {queryError && (
          <div className="px-1">
            <FeedbackBanner
              type="error"
              message={
                queryError instanceof Error
                  ? queryError.message
                  : "Failed to load users"
              }
            />
          </div>
        )}

        {/* Users Table */}
        <div className="w-full bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          {users.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-text-secondary">
              {t("noUsersFound")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-surface-hover/50 text-[11px] font-semibold text-text-secondary uppercase tracking-wider select-none hover:bg-surface-hover/50">
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead className="w-[120px]">{t("role")}</TableHead>
                    <TableHead className="w-[120px]">{t("status")}</TableHead>
                    <TableHead className="w-[150px]">Created</TableHead>
                    <TableHead className="w-[120px] text-right">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-text-primary">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-text-secondary font-mono">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "OWNER"
                              ? "default"
                              : user.role === "ADMIN"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          canToggleBan(user) ? (
                            <button
                              type="button"
                              onClick={() => handleToggleBan(user)}
                              className="cursor-pointer"
                            >
                              <Badge variant="destructive">BANNED</Badge>
                            </button>
                          ) : (
                            <Badge variant="destructive">BANNED</Badge>
                          )
                        ) : user.isPendingConfirm ? (
                          <Badge variant="warning">INVITED</Badge>
                        ) : (
                          <Badge
                            variant={user.isActive ? "success" : "secondary"}
                          >
                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {new Date(user.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {(canEditUser(user) ||
                          canDeleteUser(user) ||
                          canToggleBan(user)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1.5 rounded-md transition-colors text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                              <Icons.More className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                disabled={!canEditUser(user)}
                                onClick={() => handleOpenEdit(user)}
                                className={
                                  canEditUser(user)
                                    ? "text-text-primary"
                                    : "text-text-secondary"
                                }
                              >
                                <Icons.Edit className="w-3.5 h-3.5 mr-2 text-text-secondary" />
                                {t("editDetails")}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={!canToggleBan(user)}
                                onClick={() => handleToggleBan(user)}
                                className={
                                  canToggleBan(user)
                                    ? !user.isBanned
                                      ? "text-destructive font-medium"
                                      : "text-success font-medium"
                                    : "text-text-secondary"
                                }
                              >
                                {!user.isBanned ? (
                                  <>
                                    <Icons.Lock className="w-3.5 h-3.5 mr-2" />
                                    {t("banAccount")}
                                  </>
                                ) : (
                                  <>
                                    <Icons.Unlock className="w-3.5 h-3.5 mr-2" />
                                    {t("unbanAccount")}
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                disabled={!canDeleteUser(user)}
                                onClick={() => handleDelete(user)}
                                className={
                                  canDeleteUser(user)
                                    ? "text-destructive font-semibold focus:bg-destructive/10 focus:text-destructive"
                                    : "text-text-secondary"
                                }
                              >
                                <Icons.Trash className="w-3.5 h-3.5 mr-2" />
                                {t("deleteUser")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Modal Form */}
        <Dialog
          isOpen={showModal}
          onClose={handleCloseModal}
          title={selectedUser ? t("editUser") : t("addUser")}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formError && <FeedbackBanner type="error" message={formError} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="firstName"
                name="firstName"
                label={t("firstNameLabel")}
                value={firstNameInput}
                onChange={(e) => setFirstNameInput(e.target.value)}
                placeholder="e.g. John"
                required
                autoComplete="off"
              />
              <FormField
                id="lastName"
                name="lastName"
                label={t("lastNameLabel")}
                value={lastNameInput}
                onChange={(e) => setLastNameInput(e.target.value)}
                placeholder="e.g. Doe"
                required
                autoComplete="off"
              />
            </div>

            <FormField
              id="email"
              name="email"
              type="email"
              label={t("email")}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. john.doe@example.com"
              required
              disabled={!!selectedUser}
            />

            {selectedUser?.role !== "OWNER" && (
              <div className="flex flex-col gap-1.5 w-full">
                <Label
                  htmlFor="role"
                  className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary"
                >
                  {t("role")}
                </Label>
                <Select
                  value={roleInput}
                  onValueChange={(val) => setRoleInput(val as UserRole)}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">MEMBER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedUser?.role !== "OWNER" && roleInput !== "OWNER" && (
              <div className="flex flex-col gap-2 w-full pt-1 border-t border-border mt-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  {t("mailboxAccess")}
                </Label>
                {isLoadingMailboxes ? (
                  <div className="text-text-secondary text-xs">
                    {t("loadingMailboxes")}
                  </div>
                ) : mailboxes.length === 0 ? (
                  <div className="text-text-secondary text-xs">
                    {t("noMailboxesFound")}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-2">
                    {mailboxes.map((mailbox) => (
                      <div key={mailbox.id} className="flex items-center gap-2">
                        <input
                           type="checkbox"
                           id={`mailbox-${mailbox.id}`}
                           checked={mailboxAddressIdsInput.includes(mailbox.id)}
                           onChange={(e) => {
                             if (e.target.checked) {
                               setMailboxAddressIdsInput([
                                 ...mailboxAddressIdsInput,
                                 mailbox.id,
                               ]);
                             } else {
                               setMailboxAddressIdsInput(
                                 mailboxAddressIdsInput.filter(
                                   (id) => id !== mailbox.id,
                                 ),
                               );
                             }
                           }}
                           className="h-3.5 w-3.5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                        />
                        <label
                           htmlFor={`mailbox-${mailbox.id}`}
                           className="text-[13px] text-text-primary cursor-pointer select-none"
                        >
                           {mailbox.displayName || mailbox.address}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[12.5px] font-semibold text-text-primary">
                  {t("status")}
                </span>
                <p className="text-[11.5px] text-text-secondary">
                  {t("statusDesc")}
                </p>
              </div>
              <Switch
                checked={isActiveInput}
                onChange={setIsActiveInput}
                disabled={selectedUser?.role === "OWNER"}
              />
            </div>

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

        <ConfirmationDialog
          isOpen={isDeleteConfirmOpen}
          title={isOwner ? t("deleteConfirmTitle") : t("deactivateConfirmTitle")}
          message={
            isOwner
              ? t("deleteConfirmMessage", { name: `${userToDelete?.firstName || ""} ${userToDelete?.lastName || ""}` })
              : t("deactivateConfirmMessage", { name: userToDelete?.firstName || "" })
          }
          confirmLabel={isOwner ? t("delete") : t("deactivateUser")}
          cancelLabel={t("cancel")}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsDeleteConfirmOpen(false);
            setUserToDelete(null);
          }}
          variant="destructive"
        />

        <ConfirmationDialog
          isOpen={isStatusConfirmOpen}
          title={userToToggleBan?.isBanned ? t("unbanConfirmTitle") : t("banConfirmTitle")}
          message={
            userToToggleBan?.isBanned
              ? t("unbanConfirmMessage", { name: userToToggleBan?.firstName || "" })
              : t("banConfirmMessage", { name: userToToggleBan?.firstName || "" })
          }
          confirmLabel={
            userToToggleBan?.isBanned ? t("unbanAccount") : t("banAccount")
          }
          cancelLabel={t("cancel")}
          onConfirm={handleConfirmToggleBan}
          onCancel={() => {
            setIsStatusConfirmOpen(false);
            setUserToToggleBan(null);
          }}
          variant={userToToggleBan?.isBanned ? "default" : "destructive"}
        />
      </div>
    </div>
  );
}
