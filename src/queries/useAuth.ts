import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMeQuery() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) return null;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch user");
      return data.data?.user || null;
    },
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Registration failed");
      return result;
    },
  });
}

export function useSetupMutation() {
  return useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Setup failed");
      return result;
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 404) {
        const result = await res.json();
        throw new Error(result.error || "Failed to send reset link");
      }
      return true;
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (data: Record<string, string | null>) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok && res.status !== 404) {
        const result = await res.json();
        throw new Error(result.error || "Failed to reset password");
      }
      return true;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Logout failed");
      return result;
    },
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
      queryClient.invalidateQueries();
    },
  });
}
