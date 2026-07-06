import nodemailer from "nodemailer";

export interface MailAttachment {
  filename: string;
  content: string; // base64
  contentType: string;
}

export interface SendMailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
  priority?: "HIGH" | "DEFAULT" | "LOW";
  bypassQueue?: boolean;
  attachments?: MailAttachment[];
}

export const mailClient = {
  async sendMail(options: SendMailOptions) {
    if (!options.bypassQueue) {
      const { MailQueueService } = await import(
        "@/services/mail-queue.service"
      );
      MailQueueService.startWorker();
      return MailQueueService.enqueue(options);
    }

    const dryRun = process.env.SMTP_DRY_RUN === "true";
    const isPrimaryConfigured = !!(
      process.env.SMTP_HOST && process.env.SMTP_USER
    );

    // ── 1. CONSOLE FALLBACK LAYER ──────────────────────────────────────────────
    if (dryRun || !isPrimaryConfigured) {
      return this.sendMailConsole(options, isPrimaryConfigured);
    }

    // ── 2. BLUEPRINT: CUSTOM PROVIDER (e.g. Resend / Postmark) ─────────────────
    // if (process.env.EMAIL_PROVIDER === "RESEND") {
    //   return this.sendMailCustom(options);
    // }

    // ── 3. STANDARD SMTP DISPATCH ──────────────────────────────────────────────
    return this.sendMailSmtp(options);
  },

  async sendMailConsole(options: SendMailOptions, isConfigured: boolean) {
    const fromName = process.env.SMTP_FROM_NAME || "Mailbox Platform";
    const user = process.env.SMTP_USER || "noreply@mailbox.internal";
    const defaultFrom = `"${fromName}" <${user}>`;
    const from = options.from || defaultFrom;

    console.log("==========================================");
    console.log("📨 [MAIL DRY RUN / CONSOLE PRINT FALLBACK]");
    console.log(
      `Reason:  ${
        isConfigured ? "SMTP_DRY_RUN is active" : "SMTP is not fully configured"
      }`,
    );
    console.log(`Priority: ${options.priority || "DEFAULT"}`);
    console.log(`From:    ${from}`);
    console.log(
      `To:      ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`,
    );
    if (options.cc) {
      console.log(
        `Cc:      ${Array.isArray(options.cc) ? options.cc.join(", ") : options.cc}`,
      );
    }
    if (options.bcc) {
      console.log(
        `Bcc:     ${Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc}`,
      );
    }
    console.log(`Subject: ${options.subject}`);
    console.log(`Text:\n${options.text}`);
    if (options.html) {
      console.log(`HTML:\n${options.html}`);
    }
    console.log("==========================================");

    return {
      messageId: `mock-${Date.now()}-${crypto.randomUUID()}`,
      response: "Console print fallback success",
    };
  },

  async sendMailSmtp(options: SendMailOptions) {
    const priority = options.priority || "DEFAULT";

    // Detect SMTP channel (Primary vs Campaign)
    const useCampaignSmtp =
      priority === "LOW" &&
      !!(process.env.SMTP_CAMPAIGN_HOST && process.env.SMTP_CAMPAIGN_USER);

    const smtpConfig = useCampaignSmtp
      ? {
          host: process.env.SMTP_CAMPAIGN_HOST || "",
          port: Number(process.env.SMTP_CAMPAIGN_PORT || 587),
          secure: process.env.SMTP_CAMPAIGN_SECURE === "true",
          user: process.env.SMTP_CAMPAIGN_USER || "",
          pass: process.env.SMTP_CAMPAIGN_PASS || "",
          fromName: process.env.SMTP_CAMPAIGN_FROM_NAME || "Campaigns",
        }
      : {
          host: process.env.SMTP_HOST || "",
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true",
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
          fromName: process.env.SMTP_FROM_NAME || "Mailbox Platform",
        };

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const defaultFrom = `"${smtpConfig.fromName}" <${smtpConfig.user}>`;
    const from = options.from || defaultFrom;

    return transporter.sendMail({
      from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
        contentType: a.contentType,
      })),
    });
  },

  async sendMailCustom(_options: SendMailOptions) {
    // Blueprint placeholder for future API integrations (e.g. Resend, Postmark)
    throw new Error("Custom email provider not implemented");
  },
};
