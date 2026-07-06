import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthService } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return apiError("Email is required", 400);
    }

    await AuthService.requestPasswordReset(email);

    return apiSuccess({ success: true }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return apiError(message, 500);
  }
}
