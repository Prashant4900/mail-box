import { prisma } from "@/clients/prisma";
import type { MailAttachment } from "@/clients/mail";

export interface CreateEmailJobData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  fromAddress?: string;
  priority?: number;
  attachments?: MailAttachment[];
}

export const MailJobRepository = {
  async createJob(data: CreateEmailJobData) {
    return prisma.emailJob.create({
      data: {
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        bodyText: data.bodyText,
        bodyHtml: data.bodyHtml,
        fromAddress: data.fromAddress,
        priority: data.priority ?? 2,
        attachmentsJson: data.attachments ? JSON.stringify(data.attachments) : null,
      },
    });
  },

  async findNextPendingJobs(limit = 10) {
    return prisma.emailJob.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: limit,
    });
  },

  /**
   * Attempts to lock a job atomically by transitioning its status from PENDING to PROCESSING.
   * If another worker already locked it, this returns false.
   */
  async lockJob(id: string): Promise<boolean> {
    const result = await prisma.emailJob.updateMany({
      where: {
        id,
        status: "PENDING",
      },
      data: {
        status: "PROCESSING",
      },
    });
    return result.count > 0;
  },

  async markJobCompleted(id: string) {
    return prisma.emailJob.update({
      where: { id },
      data: {
        status: "SENT",
        processedAt: new Date(),
      },
    });
  },

  async markJobFailed(id: string, errorMsg: string, maxAttempts = 3) {
    const job = await prisma.emailJob.findUnique({
      where: { id },
      select: { attempts: true },
    });

    const nextAttempts = (job?.attempts ?? 0) + 1;
    const isPermanentFailure = nextAttempts >= maxAttempts;

    return prisma.emailJob.update({
      where: { id },
      data: {
        status: isPermanentFailure ? "FAILED" : "PENDING",
        attempts: nextAttempts,
        error: errorMsg,
        processedAt: new Date(),
      },
    });
  },

  async pruneSuccessfulJobs(olderThanDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return prisma.emailJob.deleteMany({
      where: {
        status: "SENT",
        processedAt: {
          lt: cutoffDate,
        },
      },
    });
  },
};
