import type { NextRequest } from "next/server";
import { prisma } from "@/clients/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AUTH_CONFIG } from "@/lib/auth";
import { CloudflareService } from "@/services/cloudflare.service";
import { SessionService } from "@/services/session.service";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const sessionToken = req.cookies.get(AUTH_CONFIG.session.cookieName)?.value;
    if (!sessionToken) return apiError("Not authenticated", 401);

    const sessionData = await SessionService.getSessionAndUser(sessionToken);
    if (!sessionData) return apiError("Session expired", 401);

    // Only allow OWNER to modify integration settings
    if (sessionData.user.role !== "OWNER") {
      return apiError(
        "Forbidden: Only administrators can modify Cloudflare settings",
        403,
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { apiToken, domain } = body;

    if (!apiToken || !domain) {
      return apiError("Missing required parameters: apiToken and domain", 400);
    }

    console.log(`Starting Cloudflare cleanup/delink for domain: ${domain}`);

    // 3. Step-by-step automated delinking
    // Step A: Verify token
    const tokenValid = await CloudflareService.verifyToken(apiToken);
    if (!tokenValid) {
      return apiError(
        "Invalid Cloudflare API token or token lacks permissions.",
        400,
      );
    }

    // Step B: Find Zone and Account Details
    const zoneInfo = await CloudflareService.findZoneId(apiToken, domain);
    const accountId = zoneInfo.accountId;
    const zoneId = zoneInfo.id;

    const workerName = "mailbox-email-bridge";

    // Step C: Delete catch-all rule pointing to worker
    await CloudflareService.deleteRoutingRule(apiToken, zoneId, workerName);

    // Step D: Delete Worker
    await CloudflareService.deleteWorker(apiToken, accountId, workerName);

    console.log(
      `Cloudflare delink completed successfully for domain: ${domain}`,
    );

    // Update all mailbox addresses ending with @domain to set cloudflareLinked = false
    await prisma.mailboxAddress.updateMany({
      where: {
        address: {
          endsWith: `@${domain}`,
        },
      },
      data: {
        cloudflareLinked: false,
      },
    });

    return apiSuccess({
      message:
        "Domain disconnected successfully. Cloudflare Worker and routing rules removed.",
      domain: zoneInfo.name,
    });
  } catch (error) {
    console.error("Cloudflare delink wizard error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to disconnect Cloudflare integration";
    return apiError(message, 500);
  }
}
