import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Dashboard",
};

export default async function PatientDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  // Link any recommendations sent before this user's account existed.
  // When a provider sends to a phone/email with no account yet, patientId is null.
  // We fix that up here on first dashboard visit.
  const identifiers = [session.user.email, session.user.phone].filter(Boolean) as string[];
  if (identifiers.length > 0) {
    await db.recommendation.updateMany({
      where: { patientId: null, patientIdentifier: { in: identifiers } },
      data: { patientId: session.user.id },
    });
  }

  // Get all recommendations for this patient
  const recommendations = await db.recommendation.findMany({
    where: { patientId: session.user.id },
    include: {
      items: {
        include: { product: true },
      },
      doctorProfile: {
        include: { practice: true },
      },
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get orders
  const orders = await db.order.findMany({
    where: { patientId: session.user.id },
    include: {
      items: {
        include: { product: true },
      },
      recommendation: {
        include: {
          doctorProfile: { include: { practice: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Unique doctors
  const doctors = Array.from(
    new Map(
      recommendations
        .filter((r) => r.doctorProfile != null)
        .map((r) => [r.doctorProfile!.id, r.doctorProfile!])
    ).values()
  );

  // All recommended products (deduped, from most recent recs)
  const allProducts = recommendations
    .flatMap((r) => r.items.map((i) => i.product))
    .filter(
      (product, idx, arr) =>
        arr.findIndex((p) => p.id === product.id) === idx
    )
    .slice(0, 12);

  const orderStatusColors: Record<string, "default" | "success" | "sky" | "warning" | "danger"> = {
    PENDING: "warning",
    PAID: "sky",
    SHIPPED: "sky",
    DELIVERED: "success",
    CANCELLED: "danger",
  };

  // Empty state — rendered outside the space-y-10 wrapper so it can fill the viewport
  if (recommendations.length === 0) {
    return (
      <div className="relative min-h-[calc(100vh-3.5rem)] -my-6 flex flex-col items-center justify-center px-6 py-20 overflow-hidden" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        {/* Background blobs — same language as sign-in page */}
        <div className="glass-blob w-[700px] h-[700px] bg-sage -top-40 -left-60" />
        <div className="glass-blob w-[500px] h-[500px] bg-peach -bottom-20 -right-40" />
        <div className="glass-blob w-[400px] h-[400px] bg-sky top-1/3 right-1/4" />

        {/* Hero */}
        <div className="relative z-10 text-center max-w-[580px] mx-auto">
          <div className="flex justify-center mb-8">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="70" cy="70" r="68" fill="#EEF4EC" />
              <circle cx="70" cy="92" r="17" fill="white" stroke="#87A878" strokeWidth="3" />
              <path d="M67 92h6M70 89v6" stroke="#87A878" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M70 75 C70 63 57 53 51 42" stroke="#87A878" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M70 75 C70 63 83 53 89 42" stroke="#87A878" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="51" cy="40" r="5.5" fill="#87A878" />
              <circle cx="89" cy="40" r="5.5" fill="#87A878" />
              <g transform="translate(14,98) rotate(-28)">
                <rect width="26" height="11" rx="5.5" fill="#E8A87C" opacity="0.85" />
                <line x1="13" y1="0" x2="13" y2="11" stroke="white" strokeWidth="1.5" opacity="0.5" />
              </g>
              <g transform="translate(99,20)">
                <rect width="30" height="22" rx="5" fill="#7DB9D4" opacity="0.75" />
                <rect x="4" y="5" width="11" height="12" rx="2" fill="white" opacity="0.6" />
                <rect x="18" y="7" width="8" height="2" rx="1" fill="white" opacity="0.5" />
                <rect x="18" y="11" width="6" height="2" rx="1" fill="white" opacity="0.4" />
                <rect x="18" y="15" width="7" height="2" rx="1" fill="white" opacity="0.4" />
              </g>
              <circle cx="20" cy="58" r="5" fill="#87A878" opacity="0.25" />
              <circle cx="122" cy="82" r="4" fill="#7DB9D4" opacity="0.35" />
              <circle cx="108" cy="108" r="3" fill="#E8A87C" opacity="0.3" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">
            Your recommendations will appear here
          </h2>
          <p className="text-muted leading-relaxed">
            After a visit, your provider will send you a personalized link with their exact recommendations — at the best price.
          </p>
        </div>

        {/* What to expect cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-14 w-full max-w-2xl">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" fill="#87A878" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              ),
              title: "Your doctor picks",
              desc: "They search and select exactly what's right for you",
              bg: "bg-[#EEF4EC]",
              border: "border-[#D6E8D0]",
              iconBg: "bg-[#D6E8D0]",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M2.003 5.884 10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884z" fill="#7DB9D4" />
                  <path d="m18 8.118-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118z" fill="#7DB9D4" />
                </svg>
              ),
              title: "You get one link",
              desc: "Tap it, sign in, and see everything they chose",
              bg: "bg-[#EAF4F9]",
              border: "border-[#C8E4F0]",
              iconBg: "bg-[#C8E4F0]",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 1a9 9 0 1 0 0 18A9 9 0 0 0 10 1zM6.75 9.25a.75.75 0 0 0 0 1.5h3.69l-1.22 1.22a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 1 0-1.06 1.06l1.22 1.22H6.75z" fill="#E8A87C" />
                </svg>
              ),
              title: "Best price, guaranteed",
              desc: "We match or beat any price on every product. Yes, actually.",
              bg: "bg-[#FDF3EA]",
              border: "border-[#F5DEC4]",
              iconBg: "bg-[#F5DEC4]",
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border p-4 ${card.bg} ${card.border}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                {card.icon}
              </div>
              <p className="font-semibold text-sm text-foreground">{card.title}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hello{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted mt-1">
          {`${recommendations.length} recommendation${recommendations.length !== 1 ? "s" : ""} from your doctors`}
        </p>
      </div>

      {/* My Doctors */}
      {doctors.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-4">My Doctors</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex-shrink-0 bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-4 w-48"
              >
                <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center text-sage-700 font-bold mb-3">
                  {doctor.displayName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <p className="font-semibold text-sm text-foreground leading-tight">
                  {doctor.displayName}
                </p>
                <p className="text-xs text-muted mt-0.5">{doctor.specialty}</p>
                {doctor.practice && (
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {doctor.practice.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended for you */}
      {allProducts.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-4">
            Recommended for you
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="relative aspect-square bg-gray-50">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted">{product.brand}</p>
                  <p className="text-sm font-medium text-foreground leading-tight mt-0.5 line-clamp-2">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">
                      {formatPrice(product.price)}
                    </span>
                    {product.affiliateUrl && (
                      <a
                        href={product.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-foreground text-white px-2.5 py-1 rounded-full hover:opacity-90"
                      >
                        Shop
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations list */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-4">All Recommendations</h2>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={`/r/${rec.token}`}
                className="block bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          rec.status === "PURCHASED"
                            ? "success"
                            : rec.status === "VIEWED"
                            ? "sky"
                            : "default"
                        }
                      >
                        {rec.status.charAt(0) + rec.status.slice(1).toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted">
                        {formatDate(rec.createdAt)}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-foreground">
                      {rec.doctorProfile?.displayName ?? "Unknown provider"}
                    </p>
                    <p className="text-xs text-muted">
                      {rec.items.length} product{rec.items.length !== 1 ? "s" : ""}
                      {rec.doctorProfile?.practice && ` · ${rec.doctorProfile.practice.name}`}
                    </p>
                    {rec.note && (
                      <p className="text-xs text-muted mt-1.5 line-clamp-2 italic">
                        "{rec.note}"
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-muted flex-shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Product thumbnails */}
                <div className="flex gap-1.5 mt-3">
                  {rec.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0"
                    >
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                      )}
                    </div>
                  ))}
                  {rec.items.length > 4 && (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-muted font-medium">
                      +{rec.items.length - 4}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Order History */}
      {orders.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-4">Order History</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={orderStatusColors[order.status] ?? "default"}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-foreground">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted">
                      From {order.recommendation.doctorProfile?.displayName ?? "Unknown provider"}
                    </p>
                  </div>
                  <span className="font-bold text-foreground">
                    {formatPrice(order.total)}
                  </span>
                </div>

                {/* Order items */}
                <div className="flex gap-1.5 mt-3">
                  {order.items.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0"
                    >
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
