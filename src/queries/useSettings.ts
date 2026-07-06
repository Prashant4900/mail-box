import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
    }) => {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update profile");
      return result.data.user;
    },
    onSuccess: (updatedUser) => {
      // Update global user info queries
      queryClient.setQueryData(["me"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to change password");
      return result.data;
    },
  });
}

export function useSystemDbInfoQuery(enabled = false) {
  return useQuery({
    queryKey: ["system", "db-info"],
    queryFn: async () => {
      const res = await fetch("/api/system/db-info");
      if (res.status === 401 || res.status === 403) return null;
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to fetch db info");
      return result.data;
    },
    enabled,
    retry: false,
  });
}

export function useConfigureCloudflareMutation() {
  return useMutation({
    mutationFn: async (data: {
      apiToken: string;
      domain: string;
      appUrl?: string;
    }) => {
      const res = await fetch("/api/settings/cloudflare/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to configure Cloudflare");
      }
      return result.data;
    },
  });
}

export function useDelinkCloudflareMutation() {
  return useMutation({
    mutationFn: async (data: { apiToken: string; domain: string }) => {
      const res = await fetch("/api/settings/cloudflare/delink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to disconnect Cloudflare");
      }
      return result.data;
    },
  });
}
