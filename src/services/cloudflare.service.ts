import { CLOUDFLARE_WORKER_CODE_BASE64 } from "./worker-bundle";

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  accountId: string;
}

export interface CloudflareAccount {
  id: string;
  name: string;
}

interface CFAccountResponse {
  id: string;
  name: string;
}

interface CFDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  priority?: number;
  ttl: number;
}

interface CFRuleMatcher {
  type: string;
  value?: string;
}

interface CFRuleAction {
  type: string;
  value?: string[];
}

interface CFRoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  matchers: CFRuleMatcher[];
  actions: CFRuleAction[];
}

export const CloudflareService = {
  // ── Verification ─────────────────────────────────────────────────────────

  async verifyToken(apiToken: string): Promise<boolean> {
    const res = await fetch(
      "https://api.cloudflare.com/client/v4/user/tokens/verify",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    if (!res.ok) return false;
    const data = await res.json();
    return data.success && data.result?.status === "active";
  },

  async getAccounts(apiToken: string): Promise<CloudflareAccount[]> {
    const res = await fetch("https://api.cloudflare.com/client/v4/accounts", {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch Cloudflare accounts: ${await res.text()}`,
      );
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || "Failed to fetch accounts");
    }

    return data.result.map((acc: CFAccountResponse) => ({
      id: acc.id,
      name: acc.name,
    }));
  },

  async findZoneId(
    apiToken: string,
    domainName: string,
  ): Promise<CloudflareZone> {
    const cleanDomain = domainName.trim().toLowerCase();
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${cleanDomain}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to query Cloudflare zones: ${await res.text()}`);
    }

    const data = await res.json();
    if (!data.success || !data.result || data.result.length === 0) {
      throw new Error(
        `Domain "${domainName}" not found in your Cloudflare account.`,
      );
    }

    const zone = data.result[0];
    return {
      id: zone.id,
      name: zone.name,
      status: zone.status,
      accountId: zone.account.id,
    };
  },

  // ── Email Routing State ──────────────────────────────────────────────────

  async enableEmailRouting(apiToken: string, zoneId: string): Promise<void> {
    // Check current state
    const checkRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.success && checkData.result?.enabled) {
        console.log("Cloudflare Email Routing is already enabled.");
        return;
      }
    }

    // Enable it
    const enableRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/enable`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    if (!enableRes.ok) {
      throw new Error(
        `Failed to enable Email Routing: ${await enableRes.text()}`,
      );
    }
  },

  // ── DNS Settings ──────────────────────────────────────────────────────────

  async configureDNS(apiToken: string, zoneId: string): Promise<void> {
    // 1. Fetch current DNS records
    const dnsRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    if (!dnsRes.ok) {
      throw new Error(`Failed to fetch DNS records: ${await dnsRes.text()}`);
    }

    const dnsData = await dnsRes.json();
    const records = dnsData.result || [];

    // MX destinations required for Cloudflare Email Routing
    const requiredMX = [
      { content: "route1.mx.cloudflare.net", priority: 10 },
      { content: "route2.mx.cloudflare.net", priority: 20 },
      { content: "route3.mx.cloudflare.net", priority: 30 },
    ];

    // Create missing MX records
    for (const req of requiredMX) {
      const exists = records.some(
        (r: CFDNSRecord) =>
          r.type === "MX" &&
          r.content.toLowerCase() === req.content &&
          r.priority === req.priority,
      );

      if (!exists) {
        const createRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "MX",
              name: "@",
              content: req.content,
              priority: req.priority,
              ttl: 3600,
            }),
          },
        );

        if (!createRes.ok) {
          const errText = await createRes.text();
          // Error 890190 means Cloudflare Email Routing is already managing this zone natively
          // so we don't need to manually inject the MX records.
          if (errText.includes("890190")) {
            console.log(
              `Cloudflare is natively managing MX records. Skipping manual creation.`,
            );
            continue;
          }
          throw new Error(
            `Failed to create MX record for ${req.content}: ${errText}`,
          );
        }
      }
    }

    // 2. Manage SPF record
    const spfRecord = records.find(
      (r: CFDNSRecord) => r.type === "TXT" && r.content.includes("v=spf1"),
    );

    const cloudflareSpf = "include:_spf.mx.cloudflare.net";

    if (!spfRecord) {
      // Create new SPF record
      const createRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "TXT",
            name: "@",
            content: `v=spf1 ${cloudflareSpf} ~all`,
            ttl: 3600,
          }),
        },
      );

      if (!createRes.ok) {
        const errText = await createRes.text();
        if (errText.includes("890190")) {
          console.log(
            `Cloudflare is natively managing SPF records. Skipping manual creation.`,
          );
        } else {
          throw new Error(`Failed to create SPF record: ${errText}`);
        }
      }
    } else if (!spfRecord.content.includes(cloudflareSpf)) {
      // Update existing SPF record to include Cloudflare's SPF rule
      let newContent = spfRecord.content;
      if (newContent.endsWith("~all")) {
        newContent = newContent.replace("~all", `${cloudflareSpf} ~all`);
      } else if (newContent.endsWith("-all")) {
        newContent = newContent.replace("-all", `${cloudflareSpf} -all`);
      } else {
        newContent = `${newContent.trim()} ${cloudflareSpf}`;
      }

      const updateRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${spfRecord.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "TXT",
            name: spfRecord.name,
            content: newContent,
            ttl: spfRecord.ttl,
          }),
        },
      );

      if (!updateRes.ok) {
        throw new Error(
          `Failed to update existing SPF record: ${await updateRes.text()}`,
        );
      }
    }
  },

  // ── Deploy Worker Script & Bind Secrets ──────────────────────────────────

  async deployWorker(
    apiToken: string,
    accountId: string,
    workerName: string,
    appUrl: string,
    webhookSecret: string,
  ): Promise<void> {
    // 1. Decode script from Base64
    const workerCode = Buffer.from(
      CLOUDFLARE_WORKER_CODE_BASE64,
      "base64",
    ).toString("utf-8");

    // 2. Format as multipart/form-data for ES module upload
    const formData = new FormData();
    const metadata = {
      main_module: "index.js",
    };

    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      "metadata.json",
    );
    formData.append(
      "index.js",
      new Blob([workerCode], { type: "application/javascript+module" }),
      "index.js",
    );

    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`;
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(
        `Failed to upload Worker script to Cloudflare: ${await uploadRes.text()}`,
      );
    }

    // 3. Set secrets programmatically
    const setSecret = async (name: string, text: string) => {
      const secretUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/secrets`;
      const secretRes = await fetch(secretUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          text,
          type: "secret_text",
        }),
      });

      if (!secretRes.ok) {
        throw new Error(
          `Failed to bind Worker secret "${name}": ${await secretRes.text()}`,
        );
      }
    };

    await setSecret("NEXTJS_APP_URL", appUrl);
    await setSecret("WEBHOOK_SECRET", webhookSecret);
  },

  // ── Email Routing Rule ──────────────────────────────────────────────────

  async configureRoutingRule(
    apiToken: string,
    zoneId: string,
    workerName: string,
  ): Promise<void> {
    const payload = {
      name: "Catch-all to Mailbox Worker",
      enabled: true,
      matchers: [{ type: "all" }],
      actions: [
        {
          type: "worker",
          value: [workerName],
        },
      ],
    };

    const updateRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/catch_all`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!updateRes.ok) {
      throw new Error(
        `Failed to update catch-all rule: ${await updateRes.text()}`,
      );
    }
  },

  async deleteWorker(
    apiToken: string,
    accountId: string,
    workerName: string,
  ): Promise<void> {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to delete worker: ${await res.text()}`);
    }
  },

  async deleteRoutingRule(
    apiToken: string,
    zoneId: string,
    workerName: string,
  ): Promise<void> {
    const rulesRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    if (!rulesRes.ok) {
      throw new Error(
        `Failed to list email routing rules: ${await rulesRes.text()}`,
      );
    }

    const rulesData = await rulesRes.json();
    const rules = rulesData.result || [];

    const rule = rules.find((r: CFRoutingRule) =>
      r.actions?.some(
        (a: CFRuleAction) =>
          a.type === "worker" && a.value?.includes(workerName),
      ),
    );

    if (rule) {
      const delRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${rule.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        },
      );

      if (!delRes.ok) {
        throw new Error(
          `Failed to delete routing rule: ${await delRes.text()}`,
        );
      }
    }
  },
};
