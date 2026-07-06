"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { ComposeField } from "@/components/compose/ComposeField";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  useDeleteDraftMutation,
  useDraftQuery,
  useSaveDraftMutation,
  useSendEmailMutation,
  useUpdateDraftMutation,
} from "@/queries/useEmails";
import { useMailboxAddressesQuery } from "@/queries/useMailboxAddresses";
import { useAppStore } from "@/store/useAppStore";

export default function ComposePage() {
  const router = useRouter();
  const t = useTranslations("Compose");
  const { addToast } = useAppStore();
  const { data: mailboxesData, isLoading: isLoadingMailboxes } =
    useMailboxAddressesQuery();
  const sendEmailMutation = useSendEmailMutation();

  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId");
  const [draftId, setDraftId] = useState<string | null>(draftIdParam);

  const { data: draftData, isLoading: isLoadingDraft } = useDraftQuery(
    draftId || undefined,
  );
  const saveDraftMutation = useSaveDraftMutation();
  const updateDraftMutation = useUpdateDraftMutation();
  const deleteDraftMutation = useDeleteDraftMutation();

  const mailboxes = mailboxesData?.mailboxes || [];
  const editorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    from: "",
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  });

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  interface Attachment {
    filename: string;
    content: string; // base64
    contentType: string;
    size: number;
  }
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [resizeWidth, setResizeWidth] = useState("");

  useEffect(() => {
    if (draftData) {
      const initialBody = draftData.bodyHtml || draftData.bodyText || "";
      setFormData({
        from: draftData.mailboxAddressId || "",
        to: draftData.to || "",
        cc: draftData.cc || "",
        bcc: draftData.bcc || "",
        subject: draftData.subject || "",
        body: initialBody,
      });
      if (draftData.cc) setShowCc(true);
      if (draftData.bcc) setShowBcc(true);

      if (editorRef.current && editorRef.current.innerHTML !== initialBody) {
        editorRef.current.innerHTML = initialBody;
      }
    }
  }, [draftData]);

  // Restore editor content when returning from preview mode
  useEffect(() => {
    if (!isPreviewMode && editorRef.current) {
      if (editorRef.current.innerHTML !== formData.body) {
        editorRef.current.innerHTML = formData.body;
      }
    }
  }, [isPreviewMode]);

  const handleInput = () => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        body: editorRef.current?.innerHTML || "",
      }));
    }
  };

  const execCmd = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleInput();
    }
  };

  const handleLink = () => {
    const url = prompt("Enter link URL:");
    if (url) {
      execCmd("createLink", url);
    }
  };

  const handleImage = () => {
    const fileInput = document.getElementById("editor-image-upload");
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        execCmd("insertImage", base64);
        // reset so same file can be re-selected
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        addToast(`${file.name} exceeds 10 MB limit`, "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        // dataUrl = "data:<type>;base64,<data>"
        const base64 = dataUrl.split(",")[1];
        setAttachments((prev) => [
          ...prev,
          { filename: file.name, content: base64, contentType: file.type, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      setSelectedImg(img);
      setResizeWidth(String(img.width || img.naturalWidth));
    } else {
      setSelectedImg(null);
    }
  };

  const applyImageResize = () => {
    if (selectedImg && resizeWidth) {
      const w = parseInt(resizeWidth, 10);
      if (!Number.isNaN(w) && w > 0) {
        selectedImg.style.width = `${w}px`;
        selectedImg.style.height = "auto";
        handleInput();
      }
    }
  };

  const handleSaveDraft = async () => {
    try {
      const plainText = editorRef.current?.innerText || formData.body.replace(/<[^>]*>/g, "");
      const payload = {
        mailboxAddressId: formData.from || undefined,
        to: formData.to || undefined,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        subject: formData.subject || undefined,
        bodyText: plainText || undefined,
        bodyHtml: formData.body || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      if (draftId) {
        await updateDraftMutation.mutateAsync({ id: draftId, ...payload });
        addToast("Draft updated", "success");
      } else {
        const result = await saveDraftMutation.mutateAsync(payload);
        setDraftId(result.id);
        addToast("Draft saved", "success");
      }
    } catch (_error) {
      addToast("Failed to save draft", "error");
    }
  };

  const handleSend = async () => {
    if (!formData.from) {
      addToast(t("toastSelectSender"), "error");
      return;
    }
    if (!formData.to) {
      addToast(t("toastEnterRecipient"), "error");
      return;
    }
    if (!formData.subject) {
      addToast(t("toastEnterSubject"), "error");
      return;
    }

    try {
      const plainText = editorRef.current?.innerText || formData.body.replace(/<[^>]*>/g, "");
      await sendEmailMutation.mutateAsync({
        fromId: formData.from,
        to: formData.to,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        subject: formData.subject,
        bodyText: plainText,
        bodyHtml: formData.body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      if (draftId) {
        await deleteDraftMutation.mutateAsync(draftId);
      }
      addToast(t("toastEmailQueued"), "success");
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("toastSendFailed");
      addToast(message, "error");
    }
  };

  const handleDiscard = async () => {
    if (draftId) {
      try {
        await deleteDraftMutation.mutateAsync(draftId);
        addToast("Draft deleted", "success");
      } catch (_err) {
        // ignore
      }
    }
    router.back();
  };

  return (
    <div className="flex flex-col h-full bg-surface text-primary-text">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{t("newMessage")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-1.5 h-8.5 text-[12px] px-3 font-medium"
          >
            {isPreviewMode ? (
              <>
                <Icons.Edit className="w-3.5 h-3.5" />
                Edit
              </>
            ) : (
              <>
                <Icons.Eye className="w-3.5 h-3.5" />
                Preview
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={handleDiscard}>
            {t("discard")}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={
              saveDraftMutation.isPending ||
              updateDraftMutation.isPending ||
              isLoadingDraft
            }
          >
            {saveDraftMutation.isPending || updateDraftMutation.isPending
              ? "Saving..."
              : "Save Draft"}
          </Button>
          <Button
            variant="default"
            onClick={handleSend}
            className="px-6"
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? (
              <Icons.Spinner className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Icons.Sent className="w-4 h-4 mr-2" />
            )}
            {t("send")}
          </Button>
        </div>
      </div>

      {/* Form or Preview Area */}
      {isPreviewMode ? (
        <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 gap-6 bg-surface-hover/10">
          <div className="flex flex-col gap-2 border-b border-border pb-4">
            <div className="flex text-sm">
              <span className="w-20 font-medium text-text-secondary">From:</span>
              <span className="text-text-primary">
                {mailboxes.find((m) => m.id === formData.from)?.address || formData.from || "(No sender selected)"}
              </span>
            </div>
            <div className="flex text-sm">
              <span className="w-20 font-medium text-text-secondary">To:</span>
              <span className="text-text-primary">{formData.to || "(No recipient)"}</span>
            </div>
            {formData.cc && (
              <div className="flex text-sm">
                <span className="w-20 font-medium text-text-secondary">Cc:</span>
                <span className="text-text-primary">{formData.cc}</span>
              </div>
            )}
            {formData.bcc && (
              <div className="flex text-sm">
                <span className="w-20 font-medium text-text-secondary">Bcc:</span>
                <span className="text-text-primary">{formData.bcc}</span>
              </div>
            )}
            <div className="flex text-sm mt-1">
              <span className="w-20 font-medium text-text-secondary">Subject:</span>
              <span className="text-text-primary font-semibold">{formData.subject || "(No Subject)"}</span>
            </div>
          </div>
          {/* Email Body HTML Render */}
          <div
            className="flex-1 text-text-primary text-base leading-relaxed bg-surface border border-border rounded-xl p-8 shadow-sm min-h-[300px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: formData.body || `<p class="text-text-muted italic">No content</p>` }}
          />
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col px-8 py-6 gap-4 border-b border-border">
            {/* From Field */}
            <div className="flex items-center">
              <label
                htmlFor="from-select"
                className="w-24 text-sm font-medium text-text-secondary"
              >
                {t("from")}
              </label>
              <div className="flex-1 relative">
                <Select
                  value={formData.from}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, from: val ?? "" }))
                  }
                >
                  <SelectTrigger id="from-select" className="h-10">
                    <SelectValue
                      placeholder={
                        isLoadingMailboxes
                          ? t("loadingMailboxes")
                          : t("selectMailbox")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {mailboxes.map((mb) => (
                      <SelectItem key={mb.id} value={mb.id}>
                        {mb.displayName
                          ? `${mb.displayName} <${mb.address}>`
                          : mb.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* To Field */}
            <ComposeField
              label={t("to")}
              placeholder={t("toPlaceholder")}
              value={formData.to}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, to: e.target.value }))
              }
              rightAdornment={
                <>
                  {!showCc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCc(true)}
                      className="h-6 px-2 text-xs text-text-secondary hover:text-primary-text"
                    >
                      {t("cc")}
                    </Button>
                  )}
                  {!showBcc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBcc(true)}
                      className="h-6 px-2 text-xs text-text-secondary hover:text-primary-text"
                    >
                      {t("bcc")}
                    </Button>
                  )}
                </>
              }
            />

            {/* Cc & Bcc Fields */}
            {showCc && (
              <ComposeField
                label={t("cc")}
                placeholder={t("ccPlaceholder")}
                value={formData.cc}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cc: e.target.value }))
                }
              />
            )}
            {showBcc && (
              <ComposeField
                label={t("bcc")}
                placeholder={t("bccPlaceholder")}
                value={formData.bcc}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bcc: e.target.value }))
                }
              />
            )}

            {/* Subject Field */}
            <ComposeField
              label={t("subject")}
              placeholder={t("subjectPlaceholder")}
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
            />
          </div>

          {/* Editor Area */}
          <div className="flex flex-col flex-1 bg-surface-hover/20 overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center px-8 py-3 gap-2 border-b border-border/50 text-text-secondary overflow-x-auto">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => execCmd("bold")}
                title="Bold"
              >
                <Icons.Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => execCmd("italic")}
                title="Italic"
              >
                <Icons.Italic className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleLink}
                title="Insert Link"
              >
                <Icons.Link className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleImage}
                title="Insert Image"
              >
                <Icons.Image className="w-4 h-4" />
              </Button>
              <input
                type="file"
                id="editor-image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="w-px h-4 bg-border mx-1" />
              {/* Attach File */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => document.getElementById("editor-file-attach")?.click()}
                title="Attach File"
              >
                <Icons.Attachment className="w-4 h-4" />
              </Button>
              <input
                type="file"
                id="editor-file-attach"
                multiple
                className="hidden"
                onChange={handleAttachFile}
              />
            </div>

            {/* Image Resize Toolbar (floats above editor when image is selected) */}
            {selectedImg && (
              <div className="flex items-center gap-2 px-8 py-2 bg-surface border-b border-border/50 text-sm">
                <span className="text-text-secondary font-medium">Resize image:</span>
                <input
                  type="number"
                  value={resizeWidth}
                  onChange={(e) => setResizeWidth(e.target.value)}
                  className="w-20 h-7 px-2 rounded border border-border bg-surface-hover text-primary-text text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="px"
                  min="10"
                  max="2000"
                />
                <span className="text-text-secondary">px wide</span>
                <Button type="button" size="sm" variant="outline" onClick={applyImageResize}>
                  Apply
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setSelectedImg(null)}
                  title="Dismiss"
                >
                  <Icons.Close className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <div
              contentEditable
              ref={editorRef}
              onInput={handleInput}
              onClick={handleEditorClick}
              data-placeholder={t("bodyPlaceholder")}
              className="flex-1 w-full p-8 bg-transparent border-none resize-none focus:outline-none text-base leading-relaxed text-primary-text placeholder:text-text-secondary overflow-y-auto min-h-[250px] outline-none"
            />

            {/* Attachment Chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-8 py-3 border-t border-border/50">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-hover border border-border text-sm text-primary-text max-w-[220px]"
                  >
                    <Icons.Attachment className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
                    <span className="truncate">{att.filename}</span>
                    <span className="text-text-secondary shrink-0 text-xs">
                      ({(att.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(i)}
                      className="shrink-0 text-text-secondary hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Icons.Close className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
