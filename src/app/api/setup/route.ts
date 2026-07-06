import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { UserRepository } from "@/repositories/user.repository";
import { AuthService } from "@/services/auth.service";
import { UserRegistrationSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // Prevent access if setup is already complete
    const ownerCount = await UserRepository.countOwners();
    if (ownerCount > 0) {
      return apiError(
        "Setup is already complete. Please use /api/auth/login.",
        403,
      );
    }

    const body = await req.json();
    const parseResult = UserRegistrationSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(parseResult.error.issues[0].message, 400);
    }

    const user = await AuthService.registerUser(parseResult.data);

    // Setup complete, user is OWNER
    return apiSuccess({ user }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return apiError(message, 500);
  }
}
