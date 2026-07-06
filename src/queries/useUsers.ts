import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, UserRole } from "@/types";

interface UsersResponse {
  users: User[];
}

export function useUsersQuery() {
  return useQuery<UsersResponse>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      return data.data;
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      role: UserRole;
      isActive: boolean;
      mailboxAddressIds?: string[];
    }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      return data.data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      firstName,
      lastName,
      email,
      role,
      isActive,
      isBanned,
      mailboxAddressIds,
    }: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      isBanned?: boolean;
      mailboxAddressIds?: string[];
    }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role,
          isActive,
          isBanned,
          mailboxAddressIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      return data.data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
