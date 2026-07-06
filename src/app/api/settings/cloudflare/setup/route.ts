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

    // Only allow OWNER to configure system integration settings
    if (sessionData.user.role !== "OWNER") {
      return apiError(
        "Forbidden: Only administrators can modify Cloudflare settings",
        403,
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { apiToken, domain } = body;
    let { appUrl } = body;

    if (!apiToken || !domain) {
      return apiError("Missing required parameters: apiToken and domain", 400);
    }

    // Auto-detect app URL from request origin if not supplied
    if (!appUrl) {
      appUrl = req.nextUrl.origin;
    }

    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      return apiError(
        "System error: WEBHOOK_SECRET is not configured on the server",
        500,
      );
    }

    console.log(`Starting Cloudflare setup for domain: ${domain}`);

    // 3. Step-by-step automated setup
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

    // Step C: Enable Inbound Email Routing
    await CloudflareService.enableEmailRouting(apiToken, zoneId);

    // Step D: Configure DNS Records (MX, SPF)
    await CloudflareService.configureDNS(apiToken, zoneId);

    // Step E: Deploy Worker & Set Secrets
    const workerName = "mailbox-email-bridge";
    await CloudflareService.deployWorker(
      apiToken,
      accountId,
      workerName,
      appUrl,
      webhookSecret,
    );

    // Step F: Configure Catch-all Rule pointing to Worker
    await CloudflareService.configureRoutingRule(apiToken, zoneId, workerName);

    console.log(
      `Cloudflare setup completed successfully for domain: ${domain}`,
    );

    // Update all mailbox addresses ending with @domain to set cloudflareLinked = true
    await prisma.mailboxAddress.updateMany({
      where: {
        address: {
          endsWith: `@${domain}`,
        },
      },
      data: {
        cloudflareLinked: true,
      },
    });

    return apiSuccess({
      message: "Domain configured successfully with Cloudflare Email Routing.",
      domain: zoneInfo.name,
      zoneId,
      accountId,
    });
  } catch (error) {
    console.error("Cloudflare setup wizard error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to setup Cloudflare integration";
    return apiError(message, 500);
  }
}
