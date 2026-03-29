/**
 * price-scan job
 *
 * Scheduled via BullMQ to run every 6 hours (or daily).
 * Refreshes Amazon and Walmart prices via Rainforest API for all
 * products that have an amazonUrl or walmartUrl set and are not
 * marked manualFulfillment.
 *
 * Controlled by the RAINFOREST_LIVE env var:
 *   RAINFOREST_LIVE=true  → live Rainforest API calls
 *   RAINFOREST_LIVE=false → reads existing DB records as-is (development)
 *
 * Trigger manually:
 *   POST /api/admin/price-scan   (admin-only route, to be added)
 *
 * Or schedule recurring jobs from your worker bootstrap:
 *   await priceScanQueue.add("price-scan", {}, { repeat: { every: 6 * 60 * 60 * 1000 } });
 */

import { priceScanQueue, connection, type PriceScanPayload } from "@/lib/queue";
import { scanProductPrices, scanAllProducts } from "@/lib/price-scanner";
import { Worker, type Job } from "bullmq";

export function startPriceScanWorker() {
  const worker = new Worker<PriceScanPayload>(
    priceScanQueue.name,
    async (job: Job<PriceScanPayload>) => {
      const { productId } = job.data;

      if (productId) {
        console.log(`[price-scan] Scanning product ${productId}`);
        await scanProductPrices(productId);
        console.log(`[price-scan] Done: product ${productId}`);
      } else {
        console.log("[price-scan] Starting full catalog scan");
        const { scanned, skipped } = await scanAllProducts();
        console.log(`[price-scan] Done: ${scanned} scanned, ${skipped} skipped`);
      }
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[price-scan] Job ${job?.id} failed:`, err);
  });

  return worker;
}
