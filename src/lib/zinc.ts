export interface ZincShippingAddress {
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  zip_code: string;
  city: string;
  state: string;
  country: string;
  phone_number: string;
}

export interface ZincOrderItem {
  product_id: string; // ASIN for Amazon, item ID for Walmart
  quantity: number;
}

export interface PlaceOrderParams {
  retailer: "amazon" | "walmart";
  items: ZincOrderItem[];
  shippingAddress: ZincShippingAddress;
  docPickOrderId: string; // our internal order ID for idempotency
}

export interface ZincOrderResult {
  zincOrderId: string;
  status: "placed" | "failed";
  estimatedDelivery: string | null;
}

export interface ZincOrderStatus {
  status: string;
  tracking: string | null;
  estimatedDelivery: string | null;
}

/**
 * Place an order via Zinc on behalf of the patient.
 *
 * TODO: replace stub with live Zinc API call when ZINC_API_KEY is set.
 * Live call: POST https://api.zinc.io/v1/orders
 *   Authorization: Basic base64(ZINC_API_KEY + ":")
 *   Content-Type: application/json
 *
 * From the patient's perspective this is a "BetterList order" — Zinc is
 * never referenced in any customer-facing surface.
 */
export async function placeOrder(params: PlaceOrderParams): Promise<ZincOrderResult> {
  const payload = {
    retailer: params.retailer,
    products: params.items,
    shipping_address: params.shippingAddress,
    shipping: { order_by: "price", max_days: 7, max_price: 1500 },
    is_gift: false,
    client_notes: { docpick_order_id: params.docPickOrderId },
  };

  // TODO: replace with live call
  // const credentials = Buffer.from(`${process.env.ZINC_API_KEY}:`).toString("base64");
  // const res = await fetch("https://api.zinc.io/v1/orders", {
  //   method: "POST",
  //   headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // const data = await res.json();
  // return { zincOrderId: data.request_id, status: "placed", estimatedDelivery: null };

  console.log("[Zinc stub] Would place order:", JSON.stringify(payload, null, 2));

  return {
    zincOrderId: `zinc_mock_${Date.now()}`,
    status: "placed",
    estimatedDelivery: null,
  };
}

/**
 * Get the status of a Zinc order.
 *
 * TODO: replace stub with live call.
 * Live call: GET https://api.zinc.io/v1/orders/[zincOrderId]
 */
export async function getOrderStatus(zincOrderId: string): Promise<ZincOrderStatus> {
  // TODO: replace with live call
  // const credentials = Buffer.from(`${process.env.ZINC_API_KEY}:`).toString("base64");
  // const res = await fetch(`https://api.zinc.io/v1/orders/${zincOrderId}`, {
  //   headers: { Authorization: `Basic ${credentials}` },
  // });
  // const data = await res.json();
  // return { status: data._type, tracking: data.tracking ?? null, estimatedDelivery: null };

  console.log("[Zinc stub] Would get status for:", zincOrderId);
  return { status: "placed", tracking: null, estimatedDelivery: null };
}
