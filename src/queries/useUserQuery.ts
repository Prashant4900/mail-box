// LAYER 3: QUERIES (React Query)
// Connects UI to the Service Layer using React Query hooks.

import { useQuery } from "@tanstack/react-query";
import { UserService } from "@/services/user.service";

export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => UserService.fetchUserProfile(userId),
    enabled: !!userId,
  });
}
