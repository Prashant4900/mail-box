import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { AuthService } from "@/services/auth.service";
import { SessionService } from "@/services/session.service";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return apiError("Email and password are required", 400);
    }

    const user = await AuthService.authenticateUser(email, password);
    const session = await SessionService.createSession(user.id);

    // Create response
    const response = apiSuccess({ user }, 200);

    // Set secure HTTP-only cookie using Next.js Response cookies (the modern App Router way)
    response.cookies.set(AUTH_CONFIG.session.cookieName, session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_CONFIG.session.durationDays * 24 * 60 * 60, // Convert days to seconds
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid credentials";
    return apiError(message, 401);
  }
}
