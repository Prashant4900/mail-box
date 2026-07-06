import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/clients/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { API_EMAIL_LIMIT } from "@/lib/constants";
import { SessionService } from "@/services/session.service";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Math.min(
      Number(searchParams.get("limit") ?? API_EMAIL_LIMIT),
      100,
    );

    const status = searchParams.get("status") ?? undefined;

    // Get addresses the user has access to
    let addresses: string[] = [];

    if (sessionData.user.role === "OWNER") {
      const allMailboxes = await prisma.mailboxAddress.findMany({
        where: { isActive: true },
      });
      addresses = allMailboxes.map((m) => m.address);
    } else {
      const mailboxAccesses = await prisma.userMailboxAccess.findMany({
        where: { userId: sessionData.user.id },
        include: { mailboxAddress: true },
      });
      addresses = mailboxAccesses.map((ma) => ma.mailboxAddress.address);
    }

    if (addresses.length === 0) {
      return apiSuccess({
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    const andConditions: Prisma.EmailJobWhereInput[] = [
      {
        OR: addresses.map((addr) => ({
          fromAddress: { contains: addr, mode: "insensitive" },
        })),
      },
    ];

    if (search) {
      andConditions.push({
        OR: [
          { subject: { contains: search, mode: "insensitive" } },
          { bodyText: { contains: search, mode: "insensitive" } },
          { to: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    const whereClause: Prisma.EmailJobWhereInput = { AND: andConditions };

    const jobs = await prisma.emailJob.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.emailJob.count({
      where: whereClause,
    });

    return apiSuccess({
      items: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sent emails";
    return apiError(message, 500);
  }
}
