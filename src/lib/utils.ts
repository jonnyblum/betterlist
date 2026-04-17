export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    const num = cleaned.slice(1);
    return `+1 (${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s\-().]/g, ""));
}

/**
 * Normalizes any common US phone format to E.164 (+1XXXXXXXXXX).
 * Returns null if the input cannot be resolved to a valid phone number.
 *
 * Accepts: 10 digits, 11 digits with leading 1, dashes/parens/spaces,
 * already-valid E.164 (+12158500642), and international E.164 (+44...).
 */
export function normalizePhone(phone: string): string | null {
  const digits = phone.trim().replace(/\D/g, "");
  // US area codes cannot start with 0 or 1 (NANP rule), so 10-digit numbers
  // starting with 0 or 1 (e.g. 1234567890) are structurally invalid.
  if (digits.length === 10 && digits[0] !== "0" && digits[0] !== "1") return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Non-US E.164 already provided (e.g. +447911123456) — validate shape but keep as-is
  if (phone.trim().startsWith("+") && /^\+[1-9]\d{7,14}$/.test(`+${digits}`)) return `+${digits}`;
  return null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NODE_ENV === "production") {
    console.error("NEXT_PUBLIC_APP_URL is not set in production — falling back to localhost");
  }
  return "http://localhost:3000";
}

export function getShareUrl(token: string): string {
  return `${getBaseUrl()}/r/${token}`;
}

// Simple className merge utility
type ClassValue = string | number | boolean | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
