import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { UserRepository } from "@/repositories/user.repository";
import { SessionService } from "@/services/session.service";
import { UserService } from "@/services/user.service";

// ── PATCH /api/users/[id] ────────────────────────────────────
// Private — requires OWNER or ADMIN role.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const requesterRole = sessionData.user.role;
    if (requesterRole !== "OWNER" && requesterRole !== "ADMIN") {
      return apiError("You do not have permission to update users", 403);
    }

    const payload = await req.json();

    const targetUser = await UserRepository.findUserById(id);
    if (!targetUser) return apiError("User not found", 404);

    if (requesterRole === "ADMIN") {
      if (targetUser.role === "OWNER" || targetUser.role === "ADMIN") {
        return apiError("Administrators can only update members", 403);
      }
    } else if (requesterRole === "OWNER") {
      if (
        targetUser.id === sessionData.user.id &&
        payload.role &&
        payload.role !== "OWNER"
      ) {
        return apiError("System owner role cannot be changed", 400);
      }
    }

    if (payload.role === "OWNER") {
      const existingUser = await UserRepository.findUserById(id);
      if (existingUser?.role !== "OWNER") {
        return apiError("Cannot assign the OWNER role to this account", 400);
      }
    }

    const updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      isBanned?: boolean;
      mailboxAddressIds?: string[];
    } = {};

    if (payload.firstName !== undefined) {
      updateData.firstName = payload.firstName?.trim();
    }
    if (payload.lastName !== undefined) {
      updateData.lastName = payload.lastName?.trim();
    }
    if (payload.email !== undefined) {
      updateData.email = payload.email?.trim();
    }
    if (payload.role !== undefined) {
      updateData.role = payload.role;
    }
    if (payload.isActive !== undefined) {
      updateData.isActive = !!payload.isActive;
    }
    if (payload.isBanned !== undefined) {
      updateData.isBanned = !!payload.isBanned;
    }
    if (payload.mailboxAddressIds !== undefined) {
      updateData.mailboxAddressIds = Array.isArray(payload.mailboxAddressIds)
        ? payload.mailboxAddressIds
        : [];
    }

    const user = await UserService.updateUserByAdmin(id, updateData);

    return apiSuccess({ user }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return apiError(message, 400);
  }
}

// ── DELETE /api/users/[id] ───────────────────────────────────
// Private — requires OWNER or ADMIN role.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const requesterRole = sessionData.user.role;
    if (requesterRole !== "OWNER" && requesterRole !== "ADMIN") {
      return apiError("You do not have permission to delete users", 403);
    }

    const targetUser = await UserRepository.findUserById(id);
    if (!targetUser) return apiError("User not found", 404);

    if (requesterRole === "ADMIN") {
      if (targetUser.role === "OWNER" || targetUser.role === "ADMIN") {
        return apiError("Administrators can only delete members", 403);
      }
    } else if (requesterRole === "OWNER") {
      if (targetUser.id === sessionData.user.id) {
        return apiError("System owner cannot be deleted", 400);
      }
    }

    await UserService.deleteUserByAdmin(id);

    return apiSuccess({ success: true, deleted: true }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return apiError(message, 400);
  }
}
