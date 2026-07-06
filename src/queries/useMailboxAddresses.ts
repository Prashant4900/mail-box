import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MailboxAddress } from "@/types";

interface MailboxAddressesResponse {
  mailboxes: MailboxAddress[];
}

export function useMailboxAddressesQuery() {
  return useQuery<MailboxAddressesResponse>({
    queryKey: ["mailbox-addresses"],
    queryFn: async () => {
      const res = await fetch("/api/mailbox-addresses");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to fetch mailbox addresses");
      return data.data;
    },
  });
}

export function useCreateMailboxAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      address: string;
      displayName?: string;
      isActive?: boolean;
    }) => {
      const res = await fetch("/api/mailbox-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to create mailbox address");
      return data.data.mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailbox-addresses"] });
    },
  });
}

export function useUpdateMailboxAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      address,
      displayName,
      isActive,
    }: {
      id: string;
      address?: string;
      displayName?: string;
      isActive?: boolean;
    }) => {
      const res = await fetch(`/api/mailbox-addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, displayName, isActive }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to update mailbox address");
      return data.data.mailbox;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailbox-addresses"] });
      // Invalidate emails because dynamic lists might need to pull new display names/addresses
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useDeleteMailboxAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mailbox-addresses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to delete mailbox address");
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailbox-addresses"] });
      // Invalidate emails as cascade deletes might have removed associated email records
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}
