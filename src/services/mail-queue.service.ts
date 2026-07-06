import { mailClient } from "@/clients/mail";
import { MailJobRepository } from "@/repositories/mail-job.repository";

const PRIORITY_MAP = {
  HIGH: 3,
  DEFAULT: 2,
  LOW: 1,
};

let isProcessing = false;

export const MailQueueService = {
  async enqueue(options: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text: string;
    html?: string;
    from?: string;
    priority?: "HIGH" | "DEFAULT" | "LOW";
    attachments?: Array<{ filename: string; content: string; contentType: string }>;
  }) {
    const toAddress = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;
    const ccAddress = Array.isArray(options.cc)
      ? options.cc.join(", ")
      : options.cc;
    const bccAddress = Array.isArray(options.bcc)
      ? options.bcc.join(", ")
      : options.bcc;
    const priorityLevel = PRIORITY_MAP[options.priority || "DEFAULT"];

    const job = await MailJobRepository.createJob({
      to: toAddress,
      cc: ccAddress,
      bcc: bccAddress,
      subject: options.subject,
      bodyText: options.text,
      bodyHtml: options.html || undefined,
      fromAddress: options.from || undefined,
      priority: priorityLevel,
      attachments: options.attachments,
    });

    // Ensure background worker interval is running
    this.startWorker();

    // Wake the worker immediately to process this job without waiting for the interval
    this.triggerWorker();

    return job;
  },

  triggerWorker() {
    if (isProcessing) return;
    this.processQueue().catch((err) => {
      console.error("Error running triggered mail queue process:", err);
    });
  },

  async processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const jobs = await MailJobRepository.findNextPendingJobs(5);
      for (const job of jobs) {
        // Atomic status transition lock
        const locked = await MailJobRepository.lockJob(job.id);
        if (!locked) continue;

        try {
          const priorityStr =
            job.priority === 3
              ? "HIGH"
              : job.priority === 1
                ? "LOW"
                : "DEFAULT";

          // Deserialize attachments from JSON column
          const attachments = job.attachmentsJson
            ? (JSON.parse(job.attachmentsJson) as import("@/clients/mail").MailAttachment[])
            : undefined;

          // Dispatch SMTP/Console message immediately by bypassing queue
          await mailClient.sendMail({
            to: job.to.split(",").map((e) => e.trim()),
            cc: job.cc ? job.cc.split(",").map((e) => e.trim()) : undefined,
            bcc: job.bcc ? job.bcc.split(",").map((e) => e.trim()) : undefined,
            subject: job.subject,
            text: job.bodyText,
            html: job.bodyHtml || undefined,
            from: job.fromAddress || undefined,
            priority: priorityStr as "HIGH" | "DEFAULT" | "LOW",
            bypassQueue: true, // Special flag to bypass DB queuing
            attachments,
          });

          await MailJobRepository.markJobCompleted(job.id);
        } catch (error) {
          const errMsg =
            error instanceof Error ? error.message : "SMTP Send Error";
          console.error(`[Mail Queue] Job ${job.id} failed:`, errMsg);
          await MailJobRepository.markJobFailed(job.id, errMsg);
        }
      }
    } finally {
      isProcessing = false;
    }
  },

  startWorker() {
    const globalForWorker = globalThis as unknown as {
      __mailWorkerInterval?: NodeJS.Timeout;
      __mailPruneInterval?: NodeJS.Timeout;
    };

    if (globalForWorker.__mailWorkerInterval) {
      return; // Worker already initialized
    }

    console.log("📨 Starting Background Mail Queue Worker...");

    // Poll database for pending email jobs every 3 seconds
    globalForWorker.__mailWorkerInterval = setInterval(() => {
      this.processQueue().catch((err) => {
        console.error("Error in mail queue worker interval:", err);
      });
    }, 3000);

    // Prune completed outbound emails older than 7 days once daily
    globalForWorker.__mailPruneInterval = setInterval(
      () => {
        MailJobRepository.pruneSuccessfulJobs(7)
          .then((res) => {
            if (res.count > 0) {
              console.log(
                `[Mail Queue] Cleaned up ${res.count} old successful email jobs.`,
              );
            }
          })
          .catch((err) => {
            console.error("Failed to prune old email jobs:", err);
          });
      },
      24 * 60 * 60 * 1000,
    );
  },
};
