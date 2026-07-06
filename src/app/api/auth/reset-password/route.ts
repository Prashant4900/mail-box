import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthService } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return apiError("Token and password are required", 400);
    }

    await AuthService.resetPassword(token, password);

    return apiSuccess({ success: true }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password";
    return apiError(message, 400);
  }
}
