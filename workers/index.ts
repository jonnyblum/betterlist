import "dotenv/config";
import { Worker } from "bullmq";
import {
  connection,
  QUEUES,
  type SendRecommendationPayload,
  type OrderConfirmationPayload,
  type RecommendationReminderPayload,
} from "../src/lib/queue";
import { handleSendRecommendation } from "./jobs/send-recommendation";
import { handleOrderConfirmation } from "./jobs/order-confirmation";
import { handleRecommendationReminder } from "./jobs/recommendation-reminder";
import type { Job } from "bullmq";

console.log("Starting BetterList workers...");

// Worker: Send Recommendation
const sendRecommendationWorker = new Worker<SendRecommendationPayload>(
  QUEUES.SEND_RECOMMENDATION,
  async (job: Job<SendRecommendationPayload>) => {
    await handleSendRecommendation(job);
  },
  {
    connection,
    concurrency: 5,
  }
);

sendRecommendationWorker.on("completed", (job) => {
  console.log(`[send-recommendation] Job ${job.id} completed`);
});

sendRecommendationWorker.on("failed", (job, error) => {
  console.error(`[send-recommendation] Job ${job?.id} failed:`, error.message);
});

// Worker: Order Confirmation
const orderConfirmationWorker = new Worker<OrderConfirmationPayload>(
  QUEUES.ORDER_CONFIRMATION,
  async (job: Job<OrderConfirmationPayload>) => {
    await handleOrderConfirmation(job);
  },
  {
    connection,
    concurrency: 5,
  }
);

orderConfirmationWorker.on("completed", (job) => {
  console.log(`[order-confirmation] Job ${job.id} completed`);
});

orderConfirmationWorker.on("failed", (job, error) => {
  console.error(`[order-confirmation] Job ${job?.id} failed:`, error.message);
});

// Worker: Recommendation Reminder
const reminderWorker = new Worker<RecommendationReminderPayload>(
  QUEUES.RECOMMENDATION_REMINDER,
  async (job: Job<RecommendationReminderPayload>) => {
    await handleRecommendationReminder(job);
  },
  {
    connection,
    concurrency: 3,
  }
);

reminderWorker.on("completed", (job) => {
  console.log(`[recommendation-reminder] Job ${job.id} completed`);
});

reminderWorker.on("failed", (job, error) => {
  console.error(`[recommendation-reminder] Job ${job?.id} failed:`, error.message);
});

console.log("Workers running. Waiting for jobs...");
console.log(`  • ${QUEUES.SEND_RECOMMENDATION}`);
console.log(`  • ${QUEUES.ORDER_CONFIRMATION}`);
console.log(`  • ${QUEUES.RECOMMENDATION_REMINDER}`);

// Graceful shutdown
async function shutdown() {
  console.log("\nShutting down workers...");
  await Promise.all([
    sendRecommendationWorker.close(),
    orderConfirmationWorker.close(),
    reminderWorker.close(),
    connection.quit(),
  ]);
  console.log("Workers stopped.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
