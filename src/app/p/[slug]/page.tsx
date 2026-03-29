import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface PracticePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PracticePageProps): Promise<Metadata> {
  const { slug } = await params;
  const practice = await db.practice.findUnique({ where: { slug } });
  if (!practice) return { title: "Practice Not Found" };
  return {
    title: `${practice.name} — BetterList`,
    description: practice.description ?? `Shop curated products from ${practice.name}`,
  };
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { slug } = await params;

  const practice = await db.practice.findUnique({
    where: { slug },
    include: {
      doctors: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      products: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!practice) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden bg-foreground text-white">
        <div className="absolute glass-blob w-64 h-64 bg-sage top-[-60px] right-[-30px] opacity-20" />
        <div className="absolute glass-blob w-48 h-48 bg-sky bottom-[-30px] left-[20%] opacity-15" />
        <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BetterList
          </Link>
          <h1 className="text-3xl font-bold mb-2">{practice.name}</h1>
          {practice.specialty && (
            <p className="text-white/70 mb-3">{practice.specialty}</p>
          )}
          {practice.description && (
            <p className="text-white/60 max-w-xl text-sm">{practice.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Doctors */}
        {practice.doctors.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-4">Our Doctors</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
              {practice.doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex-shrink-0 bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-4 w-44"
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
                  {doctor.specialty && (
                    <p className="text-xs text-muted mt-0.5">{doctor.specialty}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        {practice.products.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-4">
              Recommended Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {practice.products.map((product) => (
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
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {product.hsaFsaEligible && (
                        <Badge variant="sage" className="text-[10px]">HSA/FSA</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-sm">
                        {formatPrice(product.price)}
                      </span>
                      {product.affiliateUrl && (
                        <a
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-foreground text-white px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity"
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

        {practice.products.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted">No products listed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
