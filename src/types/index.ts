import type {
  User,
  DoctorProfile,
  Practice,
  Product,
  Recommendation,
  RecommendationItem,
  Order,
  OrderItem,
  ProductCategory,
  FulfillmentType,
  RecommendationStatus,
  OrderStatus,
  Role,
} from "@prisma/client";

// Re-export Prisma enums
export type { ProductCategory, FulfillmentType, RecommendationStatus, OrderStatus, Role };

// Product with all fields (including those added after initial schema)
export type ProductFull = Product & {
  fulfillmentType: FulfillmentType;
  ctaLabel: string | null;
  amazonUrl: string | null;
  walmartUrl: string | null;
  manualFulfillment: boolean;
};

// Order with all fields (including those added after initial schema)
export type OrderFull = Order & {
  retailer: string | null;
  zincOrderId: string | null;
  estimatedDelivery: Date | null;
  trackingUrl: string | null;
};

// Extended types with relations
export type ProductWithDetails = ProductFull & {
  practice?: Practice | null;
};

export type RecommendationItemWithProduct = RecommendationItem & {
  product: ProductFull;
};

export type RecommendationWithDetails = Recommendation & {
  items: RecommendationItemWithProduct[];
  doctorProfile: (DoctorProfile & {
    practice: Practice | null;
  }) | null;
  doctor: Pick<User, "id" | "name" | "email" | "image"> | null;
  patient?: Pick<User, "id" | "name" | "email" | "phone"> | null;
  order?: OrderFull | null;
};

export type DoctorProfileWithRelations = DoctorProfile & {
  user: Pick<User, "id" | "name" | "email" | "image">;
  practice: Practice;
};

export type OrderWithDetails = OrderFull & {
  items: (OrderItem & { product: ProductFull })[];
  recommendation: RecommendationWithDetails;
};

// UI-specific types
export interface CartItem {
  product: ProductFull;
  quantity: number;
}

export interface ProductSearchParams {
  search?: string;
  category?: ProductCategory;
}

export interface RecommendationFormData {
  patientIdentifier: string;
  productIds: string[];
  note?: string;
}

export interface OTPFormData {
  phone: string;
  code: string;
}

// API response types
export interface ApiResponse<T = void> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateRecommendationResponse {
  token: string;
  shareUrl: string;
  recommendationId: string;
}
