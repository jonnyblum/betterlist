import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/activity", "/onboarding", "/api/recommendations"];

// Routes that are always public
const PUBLIC_PATHS = [
  "/sign-in",
  "/api/auth",
  "/api/otp",
  "/api/products",
  "/api/recommendations/guest",
  "/api/guest-signup",
  "/builder",
  "/r/",
  "/p/",
  "/_next",
  "/favicon",
  "/public",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(":")[0];
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost";

  // In development, no subdomains
  if (hostname === "localhost" || hostname === appDomain) return null;

  // Extract subdomain: e.g. "skin-glow-derm.docpick.com" -> "skin-glow-derm"
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

export default auth((req: NextRequest & { auth: { user?: { id: string; role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  // Extract subdomain and set headers
  const subdomain = extractSubdomain(host);
  const requestHeaders = new Headers(req.headers);

  if (subdomain) {
    requestHeaders.set("x-practice-slug", subdomain);
  }

  // Check if path requires auth
  if (isProtectedPath(pathname) && !isPublicPath(pathname)) {
    const session = req.auth;

    if (!session?.user) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // OWASP security headers — applied to every response
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
