import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL ?? "redis://localhost:6379";

// Parse Upstash TLS URL if needed
function createRedisConnection(): IORedis {
  if (redisUrl.startsWith("rediss://")) {
    return new IORedis(redisUrl, {
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: null,
    });
  }
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

export const connection = createRedisConnection();

// Queue names
export const QUEUES = {
  SEND_RECOMMENDATION: "send-recommendation",
  ORDER_CONFIRMATION: "order-confirmation",
  RECOMMENDATION_REMINDER: "recommendation-reminder",
  PLACE_ZINC_ORDER: "place-zinc-order",
  PRICE_SCAN: "price-scan",
} as const;

// Create queues
export const sendRecommendationQueue = new Queue(QUEUES.SEND_RECOMMENDATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const orderConfirmationQueue = new Queue(QUEUES.ORDER_CONFIRMATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const priceScanQueue = new Queue(QUEUES.PRICE_SCAN, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 20 },
  },
});

export const placeZincOrderQueue = new Queue(QUEUES.PLACE_ZINC_ORDER, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const recommendationReminderQueue = new Queue(
  QUEUES.RECOMMENDATION_REMINDER,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  }
);

// Job payload types
export interface SendRecommendationPayload {
  recommendationId: string;
  patientIdentifier: string;
  shareToken: string;
  doctorName: string | null;
}

export interface OrderConfirmationPayload {
  orderId: string;
}

export interface RecommendationReminderPayload {
  recommendationId: string;
}

export interface PlaceZincOrderPayload {
  orderId: string;
  recommendationId: string;
  retailer: "amazon" | "walmart";
}

export interface PriceScanPayload {
  /** Scan a single product, or omit to scan all eligible products */
  productId?: string;
}

// Enqueue helpers
export async function enqueueRecommendation(
  payload: SendRecommendationPayload
): Promise<void> {
  await sendRecommendationQueue.add("send", payload);
}

export async function enqueueOrderConfirmation(
  payload: OrderConfirmationPayload
): Promise<void> {
  await orderConfirmationQueue.add("confirm", payload);
}

export async function enqueuePriceScan(
  payload: PriceScanPayload = {},
  delayMs?: number
): Promise<void> {
  await priceScanQueue.add("price-scan", payload, {
    ...(delayMs ? { delay: delayMs } : {}),
  });
}

export async function enqueuePlaceZincOrder(
  payload: PlaceZincOrderPayload
): Promise<void> {
  await placeZincOrderQueue.add("place-zinc-order", payload);
}

export async function enqueueReminderIn(
  payload: RecommendationReminderPayload,
  delayMs: number
): Promise<void> {
  await recommendationReminderQueue.add("remind", payload, { delay: delayMs });
}

export type { Job, Worker };
