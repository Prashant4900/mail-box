import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { SessionService } from "@/services/session.service";
import { UserService } from "@/services/user.service";

// ── GET /api/users ───────────────────────────────────────────
// Private — requires a valid session (accessible to OWNER, ADMIN, MEMBER).
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const users = await UserService.getAllUsers();
    return apiSuccess({ users }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return apiError(message, 500);
  }
}

// ── POST /api/users ──────────────────────────────────────────
// Private — requires OWNER or ADMIN role.
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const userRole = sessionData.user.role;
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return apiError("You do not have permission to add users", 403);
    }

    const payload = await req.json();
    const firstName = payload.firstName?.trim();
    const lastName = payload.lastName?.trim();
    const email = payload.email?.trim();
    const role = payload.role || "MEMBER";
    const isActive = payload.isActive !== false;
    const mailboxAddressIds = Array.isArray(payload.mailboxAddressIds)
      ? payload.mailboxAddressIds
      : [];

    if (role === "OWNER") {
      return apiError("Cannot create additional OWNER accounts", 400);
    }

    if (!firstName || !lastName || !email) {
      return apiError("First name, last name, and email are required", 400);
    }

    const user = await UserService.createUserByAdmin({
      firstName,
      lastName,
      email,
      role,
      isActive,
      mailboxAddressIds,
    });

    return apiSuccess({ user }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return apiError(message, 400);
  }
}
