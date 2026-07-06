import type { Draft } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EmailThread, EmailWithState } from "@/types";

interface ListEmailsResponse {
  items: EmailWithState[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useEmailsQuery(opts: {
  search?: string;
  page?: number;
  limit?: number;
  trashed?: boolean;
  starred?: boolean;
}) {
  const { search, page = 1, limit, trashed = false, starred = false } = opts;
  const searchParams = new URLSearchParams();
  if (search) searchParams.set("search", search);
  searchParams.set("page", page.toString());
  if (limit !== undefined) searchParams.set("limit", limit.toString());
  if (trashed) searchParams.set("trashed", "true");
  if (starred) searchParams.set("starred", "true");

  return useQuery<ListEmailsResponse>({
    queryKey: ["emails", { search, page, limit, trashed, starred }],
    queryFn: async () => {
      const res = await fetch(`/api/emails?${searchParams.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch emails");
      return data.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time inbox updates
  });
}

interface ThreadsResponse {
  threads: EmailThread[];
}

export function useThreadsQuery(opts: {
  search?: string;
  trashed?: boolean;
  starred?: boolean;
}) {
  const { search, trashed = false, starred = false } = opts;
  const searchParams = new URLSearchParams();
  if (search) searchParams.set("search", search);
  if (trashed) searchParams.set("trashed", "true");
  if (starred) searchParams.set("starred", "true");

  return useQuery<ThreadsResponse>({
    queryKey: ["threads", { search, trashed, starred }],
    queryFn: async () => {
      const res = await fetch(`/api/threads?${searchParams.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch threads");
      return data.data;
    },
    refetchInterval: 5000,
  });
}

export function useEmailQuery(id?: string) {
  return useQuery<{ email: EmailWithState }>({
    queryKey: ["email", id],
    queryFn: async () => {
      if (!id) throw new Error("Email ID is required");
      const res = await fetch(`/api/emails/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch email");
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "read" | "unread" | "save" | "unsave" | "trash" | "restore";
    }) => {
      const res = await fetch(`/api/emails/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update email");
      return { id, action };
    },
    onSuccess: (_, variables) => {
      // Invalidate the full email list (both inbox and trash) and specific email
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email", variables.id] });
    },
  });
}

export function useDeleteEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/emails/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete email");
      return { id };
    },
    onSuccess: () => {
      // Invalidate all email queries — email is gone from DB
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useBulkUpdateEmailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      action,
    }: {
      ids: string[];
      action: "read" | "unread" | "save" | "unsave" | "trash" | "restore";
    }) => {
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/emails/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to update email");
        }),
      );
      return { ids, action };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      for (const id of variables.ids) {
        queryClient.invalidateQueries({ queryKey: ["email", id] });
      }
    },
  });
}

export function useBulkDeleteEmailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => {
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/emails/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to delete email");
        }),
      );
      return { ids };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useSendEmailMutation() {
  return useMutation({
    mutationFn: async (payload: {
      fromId: string;
      to: string;
      cc?: string;
      bcc?: string;
      subject: string;
      bodyText?: string;
      bodyHtml?: string;
      attachments?: Array<{ filename: string; content: string; contentType: string }>;
    }) => {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      return data.data;
    },
  });
}

interface ListSentEmailsResponse {
  items: import("@/types").EmailJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useSentEmailsQuery(opts: {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { search, page = 1, limit, status } = opts;
  const searchParams = new URLSearchParams();
  if (search) searchParams.set("search", search);
  searchParams.set("page", page.toString());
  if (limit !== undefined) searchParams.set("limit", limit.toString());
  if (status) searchParams.set("status", status);

  return useQuery<ListSentEmailsResponse>({
    queryKey: ["sent-emails", { search, page, limit, status }],
    queryFn: async () => {
      const res = await fetch(`/api/emails/sent?${searchParams.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch sent emails");
      return data.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds for background job updates
  });
}

// ─────────────────────────────────────────
// DRAFTS
// ─────────────────────────────────────────

export function useDraftsQuery() {
  return useQuery<EmailThread[]>({
    queryKey: ["drafts"],
    queryFn: async () => {
      const res = await fetch("/api/emails/drafts");
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

export function useDraftQuery(id?: string) {
  return useQuery<Draft>({
    queryKey: ["draft", id],
    queryFn: async () => {
      if (!id) throw new Error("Draft ID is required");
      const res = await fetch(`/api/emails/drafts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch draft");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useSaveDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      mailboxAddressId?: string | null;
      to?: string | null;
      cc?: string | null;
      bcc?: string | null;
      subject?: string | null;
      bodyText?: string | null;
      bodyHtml?: string | null;
      attachments?: Array<{ filename: string; content: string; contentType: string }> | null;
    }) => {
      const res = await fetch("/api/emails/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useUpdateDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      mailboxAddressId?: string | null;
      to?: string | null;
      cc?: string | null;
      bcc?: string | null;
      subject?: string | null;
      bodyText?: string | null;
      bodyHtml?: string | null;
      attachments?: Array<{ filename: string; content: string; contentType: string }> | null;
    }) => {
      const res = await fetch(`/api/emails/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update draft");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["draft", variables.id] });
    },
  });
}

export function useDeleteDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/emails/drafts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete draft");
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}
