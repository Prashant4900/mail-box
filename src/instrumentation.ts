export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { MailQueueService } = await import("./services/mail-queue.service");
    MailQueueService.startWorker();
  }
}
