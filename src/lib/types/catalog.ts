import type { Product } from "@prisma/client";

/**
 * A product that can be either a saved DB record or a live Rainforest result.
 *
 * Rainforest products use a temporary id (`rf_<ASIN>`) and carry
 * `source: 'rainforest'` so the builder can trigger a background save when
 * the clinician interacts with them.  All DB products have `source: 'db'`
 * (or undefined — treated as 'db').
 */
export type CatalogProduct = Product & {
  source?: "db" | "rainforest";
};
