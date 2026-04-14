import { PrismaClient, ProductCategory, FulfillmentType, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recommendationItem.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.protocolItem.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.kitFavorite.deleteMany();
  await prisma.kitItem.deleteMany();
  await prisma.kit.deleteMany();
  await prisma.clinicianPickedProduct.deleteMany();
  await prisma.productRetailerPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.practice.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // ─── Practices ────────────────────────────────────────────────────────────

  const practice1 = await prisma.practice.create({
    data: {
      name: "Skin & Glow Dermatology",
      slug: "skin-glow-derm",
      specialty: "Dermatology",
      description:
        "Expert skincare and dermatological care for all skin types. We combine medical expertise with the latest aesthetic treatments.",
    },
  });

  const practice2 = await prisma.practice.create({
    data: {
      name: "Bright Smile Dental",
      slug: "bright-smile-dental",
      specialty: "Dentistry",
      description:
        "Comprehensive dental care focused on creating beautiful, healthy smiles using the latest technology.",
    },
  });

  // ─── Doctor Users ─────────────────────────────────────────────────────────

  const doctorUser1 = await prisma.user.create({
    data: {
      email: "sarah.chen@skin-glow-derm.com",
      name: "Dr. Sarah Chen",
      role: Role.CLINICIAN,
      onboarded: true,
      emailVerified: new Date(),
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      email: "marcus.webb@skin-glow-derm.com",
      name: "Dr. Marcus Webb",
      role: Role.CLINICIAN,
      onboarded: true,
      emailVerified: new Date(),
    },
  });

  const doctorUser3 = await prisma.user.create({
    data: {
      email: "priya.patel@bright-smile-dental.com",
      name: "Dr. Priya Patel",
      role: Role.CLINICIAN,
      onboarded: true,
      emailVerified: new Date(),
    },
  });

  // ─── Doctor Profiles ──────────────────────────────────────────────────────

  const doctorProfile1 = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser1.id,
      practiceId: practice1.id,
      displayName: "Dr. Sarah Chen",
      specialty: "Dermatology & Aesthetics",
      npi: "1234567890",
      slug: "sarah-chen",
      bio: "Board-certified dermatologist with 12 years of experience specializing in medical and cosmetic dermatology. Dr. Chen is passionate about helping patients achieve healthy, radiant skin.",
    },
  });

  await prisma.doctorProfile.create({
    data: {
      userId: doctorUser2.id,
      practiceId: practice1.id,
      displayName: "Dr. Marcus Webb",
      specialty: "Dermatology",
      npi: "0987654321",
      slug: "marcus-webb",
      bio: "Specialist in skin cancer detection and treatment, with a focus on preventive dermatology. Dr. Webb emphasizes sun protection and early detection.",
    },
  });

  const doctorProfile3 = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser3.id,
      practiceId: practice2.id,
      displayName: "Dr. Priya Patel",
      specialty: "General & Cosmetic Dentistry",
      npi: "1122334455",
      slug: "priya-patel",
      bio: "Passionate about creating confident smiles through comprehensive dental care. Dr. Patel specializes in cosmetic dentistry and preventive oral health.",
    },
  });

  // ─── Products ─────────────────────────────────────────────────────────────

  // Supplements (10)
  const supplements = await Promise.all([
    prisma.product.create({
      data: {
        name: "Nature Made Vitamin D3 2000 IU",
        brand: "Nature Made",
        imageUrl: null,
        price: 9.99,
        amazonUrl: "https://www.amazon.com/Nature-Made-Vitamin-Tablets-Value/dp/B004U3Y8NI/",
        walmartUrl: "https://www.walmart.com/ip/Nature-Made-Vitamin-D3-2000-IU-250-Softgels/10295141",
        sku: "B000FGXMX2",
        hsaFsaEligible: true,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["vitamin-d", "bone-health", "immunity"],
        description: "Nature Made Vitamin D3 2000 IU softgels. Supports bone, teeth, muscle, and immune health. USP verified.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Nature's Bounty Fish Oil Omega-3 1200mg",
        brand: "Nature's Bounty",
        imageUrl: null,
        price: 19.99,
        amazonUrl: "https://www.amazon.com/Natures-Bounty-Supplement-Supporting-Cardiovascular/dp/B000NPYY04/",
        walmartUrl: "https://www.walmart.com/ip/Nature-s-Bounty-Fish-Oil-Omega-3-1200-mg-200-Softgels/17174461",
        sku: "B000NPYY04",
        hsaFsaEligible: true,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["omega-3", "fish-oil", "heart-health"],
        description: "Nature's Bounty Fish Oil 1200mg — 200 softgels. Provides 360mg of Omega-3 per serving to support heart health.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Pure Encapsulations Magnesium Glycinate 90 caps",
        brand: "Pure Encapsulations",
        imageUrl: null,
        price: 26.00,
        amazonUrl: "https://www.amazon.com/Pure-Encapsulations-Magnesium-Glycinate-Physiological/dp/B07P5K7DQP/",
        walmartUrl: "https://www.walmart.com/ip/Pure-Encapsulations-Magnesium-Glycinate-90-Capsules/134728591",
        sku: "B0013OULVA",
        hsaFsaEligible: true,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["magnesium", "sleep", "muscle-recovery"],
        description: "Pure Encapsulations Magnesium Glycinate — highly bioavailable magnesium for sleep, muscle relaxation, and stress relief.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Nordic Naturals Ultimate Omega 90 softgels",
        brand: "Nordic Naturals",
        imageUrl: null,
        price: 42.95,
        amazonUrl: "https://www.amazon.com/Nordic-Naturals-Ultimate-Omega-SoftGels/dp/B0739KKHWL/",
        walmartUrl: "https://www.walmart.com/ip/Nordic-Naturals-Ultimate-Omega-90-Soft-Gels/44783641",
        sku: "B002CQU54Y",
        hsaFsaEligible: true,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["omega-3", "fish-oil", "heart-health", "brain"],
        description: "Nordic Naturals Ultimate Omega — concentrated omega-3 fish oil with 1280mg EPA+DHA per serving. Third-party tested.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Physician's Choice Probiotics 60 Billion CFU 30ct",
        brand: "Physician's Choice",
        imageUrl: null,
        price: 27.97,
        amazonUrl: "https://www.amazon.com/Physicians-CHOICE-Advanced-Health-Bundle/dp/B0DLPJH5FX/",
        walmartUrl: "https://www.walmart.com/ip/Physician-s-Choice-60-Billion-Probiotic-30-ct/682985743",
        sku: "B07MGKBB6P",
        hsaFsaEligible: false,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["probiotic", "gut-health", "immune"],
        description: "Physician's Choice 60 Billion CFU Probiotic — 10 strains with organic prebiotics for digestive balance and immune support.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Vital Proteins Collagen Peptides Powder",
        brand: "Vital Proteins",
        imageUrl: null,
        price: 29.00,
        amazonUrl: "https://www.amazon.com/Vital-Proteins-Pasture-Raised-Grass-Fed-Collagen/dp/B00NLR1PX0/",
        walmartUrl: "https://www.walmart.com/ip/Vital-Proteins-Collagen-Peptides-Powder-Unflavored-14-3-oz/166953922",
        sku: "B00K6KAM7A",
        hsaFsaEligible: false,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["collagen", "skin-health", "joint", "hair"],
        description: "Vital Proteins Collagen Peptides — unflavored, grass-fed hydrolyzed collagen powder. Mixes easily into any beverage.",
      },
    }),
    prisma.product.create({
      data: {
        name: "NatureWise Vitamin D3 5000 IU 360ct",
        brand: "NatureWise",
        imageUrl: null,
        price: 15.99,
        amazonUrl: "https://www.amazon.com/NatureWise-Vitamin-Function-Cold-Pressed-Gluten-Free/dp/B00GB85JR4/",
        walmartUrl: "https://www.walmart.com/ip/NatureWise-Vitamin-D3-5000-IU-360-Count/162558071",
        sku: "B00GB85JR4",
        hsaFsaEligible: true,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["vitamin-d", "bone-health", "immunity"],
        description: "NatureWise Vitamin D3 5000 IU — 360 softgels in organic olive oil for better absorption. Supports bone, immune, and muscle health.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Nature Made Super B-Complex 160ct",
        brand: "Nature Made",
        imageUrl: null,
        price: 11.99,
        amazonUrl: "https://www.amazon.com/Nature-Made-Complex-Softgels-Metabolic/dp/B0828JPY9N/",
        walmartUrl: "https://www.walmart.com/ip/Nature-Made-Super-B-Complex-140-Tablets/17173710",
        sku: "B000GG87UO",
        hsaFsaEligible: true,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["b-vitamins", "energy", "brain"],
        description: "Nature Made Super B-Complex with Vitamin C — complete B vitamin formula for energy metabolism and nervous system support.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Emergen-C Vitamin C 1000mg 30ct",
        brand: "Emergen-C",
        imageUrl: null,
        price: 10.99,
        amazonUrl: "https://www.amazon.com/Emergen-C-Crystals-Supplement-Vitamins-Manganese/dp/B0BSV1XGXR/",
        walmartUrl: "https://www.walmart.com/ip/Emergen-C-1000mg-Vitamin-C-Powder-30-Count/10292539",
        sku: "B000MGOXEC",
        hsaFsaEligible: true,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["vitamin-c", "immunity", "antioxidant"],
        description: "Emergen-C 1000mg Vitamin C effervescent powder drink mix — with B vitamins and electrolytes to support immune health.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Goli Ashwagandha Gummies KSM-66 60ct",
        brand: "Goli",
        imageUrl: null,
        price: 19.99,
        amazonUrl: "https://www.amazon.com/ASHWA-Vitamin-Gummy-Goli-Nutrition/dp/B094T2BZCK/",
        walmartUrl: "https://www.walmart.com/ip/Goli-Ashwagandha-Gummies-60-Count/573073485",
        sku: "B08CK4LRSB",
        hsaFsaEligible: false,
        category: ProductCategory.SUPPLEMENTS,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["ashwagandha", "stress", "adaptogen", "sleep"],
        description: "Goli Ashwagandha KSM-66 Gummies — 60ct. Clinically studied ashwagandha for stress relief, energy, and restful sleep.",
      },
    }),
  ]);

  // Skincare (6) — ProductCategory.COSMETIC
  const skincare = await Promise.all([
    prisma.product.create({
      data: {
        name: "CeraVe Moisturizing Cream 19oz",
        brand: "CeraVe",
        imageUrl: null,
        price: 18.97,
        amazonUrl: "https://www.amazon.com/CeraVe-Moisturizing-Cream-Daily-Moisturizer/dp/B00TTD9BRC/",
        walmartUrl: "https://www.walmart.com/ip/CeraVe-Moisturizing-Cream-19-oz/44392458",
        sku: "B00TTD9BRC",
        hsaFsaEligible: false,
        category: ProductCategory.COSMETIC,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["moisturizer", "ceramides", "dry-skin"],
        description: "CeraVe Moisturizing Cream — 19oz tub. Non-greasy formula with ceramides and hyaluronic acid for face and body. Fragrance-free.",
        practiceId: practice1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "CeraVe Hydrating Facial Cleanser 16oz",
        brand: "CeraVe",
        imageUrl: null,
        price: 15.97,
        amazonUrl: "https://www.amazon.com/CeraVe-Hydrating-Facial-Cleanser-Fragrance/dp/B01MSSDEPK/",
        walmartUrl: "https://www.walmart.com/ip/CeraVe-Hydrating-Facial-Cleanser-16-fl-oz/183329039",
        sku: "B01MSSDEPK",
        hsaFsaEligible: false,
        category: ProductCategory.COSMETIC,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["cleanser", "ceramides", "gentle", "normal-to-dry"],
        description: "CeraVe Hydrating Facial Cleanser — gentle, soap-free formula with ceramides and hyaluronic acid. Doesn't disrupt skin barrier.",
        practiceId: practice1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "La Roche-Posay Anthelios Melt-in Milk Sunscreen SPF 100 3oz",
        brand: "La Roche-Posay",
        imageUrl: null,
        price: 37.99,
        amazonUrl: "https://www.amazon.com/Roche-Posay-Anthelios-Sunscreen-Oxybenzone-Sensitive/dp/B07YGVSGMW/",
        walmartUrl: "https://www.walmart.com/ip/La-Roche-Posay-Anthelios-Melt-in-Milk-Sunscreen-SPF-100/416698765",
        sku: "B079MZQ97C",
        hsaFsaEligible: true,
        category: ProductCategory.COSMETIC,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["sunscreen", "spf100", "broad-spectrum"],
        description: "La Roche-Posay Anthelios SPF 100 Melt-In Milk Sunscreen — broad-spectrum UVA/UVB protection. Water-resistant 80 minutes.",
        practiceId: practice1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "La Roche-Posay Toleriane Hydrating Gentle Cleanser 13.52oz",
        brand: "La Roche-Posay",
        imageUrl: null,
        price: 19.99,
        amazonUrl: "https://www.amazon.com/Roche-Posay-Toleriane-Hydrating-Gentle-Cleanser/dp/B01N7T7JKJ/",
        walmartUrl: "https://www.walmart.com/ip/La-Roche-Posay-Toleriane-Hydrating-Gentle-Cleanser-13-52-fl-oz/155853873",
        sku: "B01N7T7JKJ",
        hsaFsaEligible: false,
        category: ProductCategory.COSMETIC,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["cleanser", "sensitive-skin", "gentle"],
        description: "La Roche-Posay Toleriane Hydrating Gentle Cleanser — soap-free, fragrance-free formula for sensitive and dry skin types.",
        practiceId: practice1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Neutrogena Rapid Wrinkle Repair Retinol Cream 1.7oz",
        brand: "Neutrogena",
        imageUrl: null,
        price: 21.97,
        amazonUrl: "https://www.amazon.com/Neutrogena-Wrinkle-Retinol-Anti-Wrinkle-Regenerating/dp/B01HOHBS6G/",
        walmartUrl: "https://www.walmart.com/ip/Neutrogena-Rapid-Wrinkle-Repair-Retinol-Serum-1-oz/15745174",
        sku: "B00BVBR27Y",
        hsaFsaEligible: false,
        category: ProductCategory.COSMETIC,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["retinol", "anti-aging", "serum", "wrinkles"],
        description: "Neutrogena Rapid Wrinkle Repair Retinol Serum — fast-acting retinol serum that visibly reduces fine lines and wrinkles.",
        practiceId: practice1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "EltaMD UV Clear Broad-Spectrum SPF 46 1.7oz",
        brand: "EltaMD",
        imageUrl: null,
        price: 39.00,
        amazonUrl: "https://www.amazon.com/EltaMD-Clear-Tinted-Sunscreen-Face/dp/B002MSN3QQ/",
        walmartUrl: "https://www.walmart.com/ip/EltaMD-UV-Clear-Face-Sunscreen-SPF-46/374579542",
        sku: "B002MSN3QQ",
        hsaFsaEligible: true,
        category: ProductCategory.COSMETIC,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["sunscreen", "spf46", "acne-prone", "sensitive"],
        description: "EltaMD UV Clear SPF 46 — dermatologist-recommended facial sunscreen with niacinamide. Great for acne-prone and sensitive skin.",
        practiceId: practice1.id,
      },
    }),
  ]);

  // Dental (5)
  const dental = await Promise.all([
    prisma.product.create({
      data: {
        name: "Oral-B Pro 1000 Electric Toothbrush",
        brand: "Oral-B",
        imageUrl: null,
        price: 49.99,
        amazonUrl: "https://www.amazon.com/Oral-B-Black-Pro-1000-Rechargeable/dp/B01AKGRTUM/",
        walmartUrl: "https://www.walmart.com/ip/Oral-B-Pro-1000-Rechargeable-Electric-Toothbrush/46669501",
        sku: "B00AOHXKM4",
        hsaFsaEligible: true,
        category: ProductCategory.DENTAL,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["electric-toothbrush", "rechargeable"],
        description: "Oral-B Pro 1000 Rechargeable Electric Toothbrush — removes up to 300% more plaque than a manual toothbrush. Includes pressure sensor.",
        practiceId: practice2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Waterpik Aquarius Water Flosser WP-660",
        brand: "Waterpik",
        imageUrl: null,
        price: 59.99,
        amazonUrl: "https://www.amazon.com/Waterpik-Aquarius-Professional-WP-662-Packaging/dp/B01LXY19XD/",
        walmartUrl: "https://www.walmart.com/ip/Waterpik-Aquarius-Water-Flosser/46102722",
        sku: "B00HFQQ0VU",
        hsaFsaEligible: true,
        category: ProductCategory.DENTAL,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["water-flosser", "flossing", "gum-health"],
        description: "Waterpik Aquarius Water Flosser WP-660 — ADA accepted, 10 pressure settings, 7 tips included. Clinically proven to remove plaque.",
        practiceId: practice2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Crest Pro-Health Gum Detoxify Toothpaste 4.8oz",
        brand: "Crest",
        imageUrl: null,
        price: 11.97,
        amazonUrl: "https://www.amazon.com/Crest-Pro-Health-Detoxify-Clean-Toothpaste/dp/B0CMW3G4F5/",
        walmartUrl: "https://www.walmart.com/ip/Crest-Pro-Health-Gum-Detoxify-Deep-Clean-Toothpaste-4-8oz-2pk/406636056",
        sku: "B07C53D4NQ",
        hsaFsaEligible: false,
        category: ProductCategory.DENTAL,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["toothpaste", "gum-health", "fluoride"],
        description: "Crest Pro-Health Gum Detoxify Deep Clean Toothpaste — 2-pack. Neutralizes plaque bacteria at the gum line for healthier gums.",
        practiceId: practice2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Listerine Total Care Anticavity Mouthwash 1L",
        brand: "Listerine",
        imageUrl: null,
        price: 9.97,
        amazonUrl: "https://www.amazon.com/Listerine-Anticavity-Mouthwash-Strengthens-ADA-Accepted/dp/B0DSHWJHH8",
        walmartUrl: "https://www.walmart.com/ip/Listerine-Total-Care-Anticavity-Fluoride-Mouthwash-1-L/10784165",
        sku: "B001ETQ8GC",
        hsaFsaEligible: false,
        category: ProductCategory.DENTAL,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["mouthwash", "fluoride", "anticavity"],
        description: "Listerine Total Care Anticavity Mouthwash 1L — 6-in-1 formula with fluoride to strengthen enamel and prevent cavities.",
        practiceId: practice2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Philips Sonicare ProtectiveClean 4100 Electric Toothbrush",
        brand: "Philips Sonicare",
        imageUrl: null,
        price: 39.99,
        amazonUrl: "https://www.amazon.com/Philips-Sonicare-Toothbrush-Rechargeable-HX3681/dp/B09LD8T445/",
        walmartUrl: "https://www.walmart.com/ip/Philips-Sonicare-4100-Power-Toothbrush/284462755",
        sku: "B078GVDB19",
        hsaFsaEligible: true,
        category: ProductCategory.DENTAL,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["electric-toothbrush", "sonic", "rechargeable"],
        description: "Philips Sonicare ProtectiveClean 4100 — sonic toothbrush with pressure sensor and 2-minute timer. Removes 7x more plaque.",
        practiceId: practice2.id,
      },
    }),
  ]);

  // Devices (4)
  const devices = await Promise.all([
    prisma.product.create({
      data: {
        name: "OMRON Platinum Blood Pressure Monitor BP5450",
        brand: "OMRON",
        imageUrl: null,
        price: 79.99,
        amazonUrl: "https://www.amazon.com/dp/B07QR3B78F",
        walmartUrl: "https://www.walmart.com/ip/OMRON-Platinum-Blood-Pressure-Monitor/178043859",
        sku: "B07QR3B78F",
        hsaFsaEligible: true,
        category: ProductCategory.DEVICES,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["blood-pressure", "monitoring", "heart-health"],
        description: "OMRON Platinum Blood Pressure Monitor BP5450 — clinically validated upper arm monitor with dual display and 200-reading memory for two users.",
      },
    }),
    prisma.product.create({
      data: {
        name: "OMRON Silver Blood Pressure Monitor BP5250",
        brand: "OMRON",
        imageUrl: null,
        price: 49.99,
        amazonUrl: "https://www.amazon.com/Pressure-Clinically-Validated-Unlimited-Measurements/dp/B0DD46HGC9",
        walmartUrl: "https://www.walmart.com/ip/OMRON-Silver-Blood-Pressure-Monitor/56826452",
        sku: "B01N8UULZD",
        hsaFsaEligible: true,
        category: ProductCategory.DEVICES,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["blood-pressure", "monitoring", "heart-health"],
        description: "OMRON Silver Blood Pressure Monitor BP5250 — clinically validated upper arm monitor with 80-reading memory and irregular heartbeat detection.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Innovo Deluxe Fingertip Pulse Oximeter iP900AP",
        brand: "Innovo",
        imageUrl: null,
        price: 39.99,
        amazonUrl: "https://www.amazon.com/Innovo-Fingertip-Oximeter-Plethysmograph-Perfusion/dp/B07YVGZPRZ/",
        walmartUrl: "https://www.walmart.com/ip/Innovo-Deluxe-Fingertip-Pulse-Oximeter/167283950",
        sku: "B00R5XQO5U",
        hsaFsaEligible: true,
        category: ProductCategory.DEVICES,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["pulse-oximeter", "oxygen", "monitoring"],
        description: "Innovo Deluxe Fingertip Pulse Oximeter iP900AP — accurately measures SpO2 and pulse rate with plethysmograph and perfusion index.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Zacurate Pro Series 500DL Fingertip Pulse Oximeter",
        brand: "Zacurate",
        imageUrl: null,
        price: 19.99,
        amazonUrl: "https://www.amazon.com/Zacurate-Fingertip-Oximeter-Saturation-Batteries/dp/B07PQ8WTC4/",
        walmartUrl: "https://www.walmart.com/ip/Zacurate-500DL-Fingertip-Pulse-Oximeter/284463891",
        sku: "B00P4XQRPU",
        hsaFsaEligible: true,
        category: ProductCategory.DEVICES,
        fulfillmentType: FulfillmentType.PHYSICAL,
        manualFulfillment: false,
        tags: ["pulse-oximeter", "oxygen", "monitoring"],
        description: "Zacurate Pro Series 500DL Fingertip Pulse Oximeter — accurate SpO2 and pulse rate readings with bright OLED display.",
      },
    }),
  ]);

  // Apps (5) — DIGITAL
  const apps = await Promise.all([
    prisma.product.create({
      data: {
        name: "Calm — Mental Wellness & Sleep",
        brand: "Calm",
        imageUrl: null,
        price: 0,
        sku: "calm-app",
        hsaFsaEligible: false,
        category: ProductCategory.APPS,
        fulfillmentType: FulfillmentType.DIGITAL,
        manualFulfillment: true,
        ctaLabel: "Download",
        affiliateUrl: "https://calm.com",
        tags: ["sleep", "meditation", "mental-health", "stress"],
        description: "Science-backed meditation, sleep stories, and relaxation techniques to reduce stress and improve sleep quality.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Headspace — Meditation & Mindfulness",
        brand: "Headspace",
        imageUrl: null,
        price: 0,
        sku: "headspace-app",
        hsaFsaEligible: false,
        category: ProductCategory.APPS,
        fulfillmentType: FulfillmentType.DIGITAL,
        manualFulfillment: true,
        ctaLabel: "Download",
        affiliateUrl: "https://headspace.com",
        tags: ["meditation", "mindfulness", "stress", "focus"],
        description: "Guided meditation, mindfulness exercises, and sleep support to help you build a daily meditation habit.",
      },
    }),
    prisma.product.create({
      data: {
        name: "MyFitnessPal — Calorie & Nutrition Tracker",
        brand: "MyFitnessPal",
        imageUrl: null,
        price: 0,
        sku: "myfitnesspal-app",
        hsaFsaEligible: false,
        category: ProductCategory.APPS,
        fulfillmentType: FulfillmentType.DIGITAL,
        manualFulfillment: true,
        ctaLabel: "Get App",
        affiliateUrl: "https://myfitnesspal.com",
        tags: ["nutrition", "calorie-tracking", "diet", "weight-loss"],
        description: "Track calories, macros, and nutrition with the world's largest food database. Set goals and monitor your progress.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Noom — Weight Management Program",
        brand: "Noom",
        imageUrl: null,
        price: 0,
        sku: "noom-app",
        hsaFsaEligible: false,
        category: ProductCategory.APPS,
        fulfillmentType: FulfillmentType.DIGITAL,
        manualFulfillment: true,
        ctaLabel: "Start Noom",
        affiliateUrl: "https://noom.com",
        tags: ["weight-loss", "psychology", "coaching", "diet"],
        description: "Psychology-based weight management program with daily lessons, food logging, and personal coaching support.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Strava — Fitness & Activity Tracking",
        brand: "Strava",
        imageUrl: null,
        price: 0,
        sku: "strava-app",
        hsaFsaEligible: false,
        category: ProductCategory.APPS,
        fulfillmentType: FulfillmentType.DIGITAL,
        manualFulfillment: true,
        ctaLabel: "Get App",
        affiliateUrl: "https://strava.com",
        tags: ["fitness", "running", "cycling", "activity-tracking"],
        description: "Track runs, rides, and workouts. Analyze your performance, set goals, and connect with a global fitness community.",
      },
    }),
  ]);

  // Wearables (5) — AFFILIATE
  const wearables = await Promise.all([
    prisma.product.create({
      data: {
        name: "Apple Watch Series 10",
        brand: "Apple",
        imageUrl: null,
        price: 399.00,
        sku: "B0DGHQWFNL",
        hsaFsaEligible: false,
        category: ProductCategory.WEARABLES,
        fulfillmentType: FulfillmentType.AFFILIATE,
        manualFulfillment: true,
        ctaLabel: "Shop Apple Watch",
        affiliateUrl: "https://www.amazon.com/Apple-Watch-Smartwatch-Aluminum-Always/dp/B0FQF9ZX7P/",
        tags: ["smartwatch", "heart-rate", "ecg", "sleep-tracking"],
        description: "Apple Watch Series 10 — thinnest Apple Watch ever with advanced health sensors, sleep tracking, and ECG monitoring.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Fitbit Charge 6",
        brand: "Fitbit",
        imageUrl: null,
        price: 159.95,
        sku: "B0CDW5Q7LC",
        hsaFsaEligible: false,
        category: ProductCategory.WEARABLES,
        fulfillmentType: FulfillmentType.AFFILIATE,
        manualFulfillment: true,
        ctaLabel: "Shop Fitbit",
        affiliateUrl: "https://www.amazon.com/dp/B0CDW5Q7LC",
        tags: ["fitness-tracker", "heart-rate", "sleep", "stress"],
        description: "Fitbit Charge 6 — advanced fitness tracker with built-in GPS, heart rate monitoring, stress management, and Google Maps.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Oura Ring Gen 3",
        brand: "Oura",
        imageUrl: null,
        price: 299.00,
        sku: "oura-ring-gen3",
        hsaFsaEligible: false,
        category: ProductCategory.WEARABLES,
        fulfillmentType: FulfillmentType.AFFILIATE,
        manualFulfillment: true,
        ctaLabel: "Shop Oura Ring",
        affiliateUrl: "https://ouraring.com/product/rings",
        tags: ["smart-ring", "sleep", "readiness", "heart-rate"],
        description: "Oura Ring Gen 3 — discreet smart ring with best-in-class sleep tracking, readiness score, and continuous heart rate monitoring.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Garmin Forerunner 265",
        brand: "Garmin",
        imageUrl: null,
        price: 349.99,
        sku: "B0BS1KXPBP",
        hsaFsaEligible: false,
        category: ProductCategory.WEARABLES,
        fulfillmentType: FulfillmentType.AFFILIATE,
        manualFulfillment: true,
        ctaLabel: "Shop Garmin",
        affiliateUrl: "https://www.amazon.com/dp/B0BS1KXPBP",
        tags: ["running", "gps", "training", "heart-rate"],
        description: "Garmin Forerunner 265 — advanced GPS running watch with AMOLED display, training readiness, and detailed health metrics.",
      },
    }),
    prisma.product.create({
      data: {
        name: "Whoop 4.0",
        brand: "Whoop",
        imageUrl: null,
        price: 0,
        sku: "whoop-4",
        hsaFsaEligible: false,
        category: ProductCategory.WEARABLES,
        fulfillmentType: FulfillmentType.AFFILIATE,
        manualFulfillment: true,
        ctaLabel: "Join Whoop",
        affiliateUrl: "https://www.whoop.com/membership",
        tags: ["recovery", "strain", "sleep", "hrv"],
        description: "Whoop 4.0 — membership-based fitness tracker focused on recovery, strain, and sleep coaching with continuous HRV monitoring.",
      },
    }),
  ]);

  // ─── Retailer Prices ──────────────────────────────────────────────────────
  // All products get both Amazon and Walmart prices.
  // retailerProductId = ASIN for Amazon, Walmart item ID for Walmart.

  const retailerPriceData: Array<{
    productId: string;
    amazonPrice: number;
    walmartPrice: number;
    amazonUrl: string;
    walmartUrl: string;
    asin: string;
    walmartItemId: string;
  }> = [
    // Supplements
    { productId: supplements[0].id, amazonPrice: 9.99,  walmartPrice: 9.48,  amazonUrl: "https://www.amazon.com/dp/B000FGXMX2", walmartUrl: "https://www.walmart.com/ip/Nature-Made-Vitamin-D3-2000-IU-250-Softgels/10295141",             asin: "B000FGXMX2", walmartItemId: "10295141" },
    { productId: supplements[1].id, amazonPrice: 19.99, walmartPrice: 18.97, amazonUrl: "https://www.amazon.com/dp/B000NPYY04",  walmartUrl: "https://www.walmart.com/ip/Nature-s-Bounty-Fish-Oil-Omega-3-1200-mg-200-Softgels/17174461",         asin: "B000NPYY04",  walmartItemId: "17174461" },
    { productId: supplements[2].id, amazonPrice: 26.00, walmartPrice: 25.49, amazonUrl: "https://www.amazon.com/dp/B0013OULVA",  walmartUrl: "https://www.walmart.com/ip/Pure-Encapsulations-Magnesium-Glycinate-90-Capsules/134728591",          asin: "B0013OULVA",  walmartItemId: "134728591" },
    { productId: supplements[3].id, amazonPrice: 42.95, walmartPrice: 41.00, amazonUrl: "https://www.amazon.com/dp/B002CQU54Y",  walmartUrl: "https://www.walmart.com/ip/Nordic-Naturals-Ultimate-Omega-90-Soft-Gels/44783641",                   asin: "B002CQU54Y",  walmartItemId: "44783641" },
    { productId: supplements[4].id, amazonPrice: 27.97, walmartPrice: 26.97, amazonUrl: "https://www.amazon.com/dp/B07MGKBB6P",  walmartUrl: "https://www.walmart.com/ip/Physician-s-Choice-60-Billion-Probiotic-30-ct/682985743",               asin: "B07MGKBB6P",  walmartItemId: "682985743" },
    { productId: supplements[5].id, amazonPrice: 29.00, walmartPrice: 28.00, amazonUrl: "https://www.amazon.com/dp/B00K6KAM7A",  walmartUrl: "https://www.walmart.com/ip/Vital-Proteins-Collagen-Peptides-Powder-Unflavored-14-3-oz/166953922",    asin: "B00K6KAM7A",  walmartItemId: "166953922" },
    { productId: supplements[6].id, amazonPrice: 15.99, walmartPrice: 15.49, amazonUrl: "https://www.amazon.com/dp/B00GB85JR4",  walmartUrl: "https://www.walmart.com/ip/NatureWise-Vitamin-D3-5000-IU-360-Count/162558071",                      asin: "B00GB85JR4",  walmartItemId: "162558071" },
    { productId: supplements[7].id, amazonPrice: 11.99, walmartPrice: 10.98, amazonUrl: "https://www.amazon.com/dp/B000GG87UO",  walmartUrl: "https://www.walmart.com/ip/Nature-Made-Super-B-Complex-140-Tablets/17173710",                       asin: "B000GG87UO",  walmartItemId: "17173710" },
    { productId: supplements[8].id, amazonPrice: 10.99, walmartPrice: 9.98,  amazonUrl: "https://www.amazon.com/dp/B000MGOXEC",  walmartUrl: "https://www.walmart.com/ip/Emergen-C-1000mg-Vitamin-C-Powder-30-Count/10292539",                    asin: "B000MGOXEC",  walmartItemId: "10292539" },
    { productId: supplements[9].id, amazonPrice: 19.99, walmartPrice: 18.98, amazonUrl: "https://www.amazon.com/dp/B08CK4LRSB",  walmartUrl: "https://www.walmart.com/ip/Goli-Ashwagandha-Gummies-60-Count/573073485",                           asin: "B08CK4LRSB",  walmartItemId: "573073485" },
    // Skincare
    { productId: skincare[0].id,    amazonPrice: 18.97, walmartPrice: 16.97, amazonUrl: "https://www.amazon.com/dp/B00TTD9BRC",  walmartUrl: "https://www.walmart.com/ip/CeraVe-Moisturizing-Cream-19-oz/44392458",                              asin: "B00TTD9BRC",  walmartItemId: "44392458" },
    { productId: skincare[1].id,    amazonPrice: 15.97, walmartPrice: 13.97, amazonUrl: "https://www.amazon.com/dp/B01MSSDEPK",  walmartUrl: "https://www.walmart.com/ip/CeraVe-Hydrating-Facial-Cleanser-16-fl-oz/183329039",                   asin: "B01MSSDEPK",  walmartItemId: "183329039" },
    { productId: skincare[2].id,    amazonPrice: 37.99, walmartPrice: 35.97, amazonUrl: "https://www.amazon.com/dp/B079MZQ97C",  walmartUrl: "https://www.walmart.com/ip/La-Roche-Posay-Anthelios-Melt-in-Milk-Sunscreen-SPF-100/416698765",     asin: "B079MZQ97C",  walmartItemId: "416698765" },
    { productId: skincare[3].id,    amazonPrice: 19.99, walmartPrice: 18.97, amazonUrl: "https://www.amazon.com/dp/B01N7T7JKJ",  walmartUrl: "https://www.walmart.com/ip/La-Roche-Posay-Toleriane-Hydrating-Gentle-Cleanser-13-52-fl-oz/155853873", asin: "B01N7T7JKJ", walmartItemId: "155853873" },
    { productId: skincare[4].id,    amazonPrice: 21.97, walmartPrice: 19.97, amazonUrl: "https://www.amazon.com/dp/B00BVBR27Y",  walmartUrl: "https://www.walmart.com/ip/Neutrogena-Rapid-Wrinkle-Repair-Retinol-Serum-1-oz/15745174",           asin: "B00BVBR27Y",  walmartItemId: "15745174" },
    { productId: skincare[5].id,    amazonPrice: 39.00, walmartPrice: 37.50, amazonUrl: "https://www.amazon.com/dp/B002MSN3QQ",  walmartUrl: "https://www.walmart.com/ip/EltaMD-UV-Clear-Face-Sunscreen-SPF-46/374579542",                        asin: "B002MSN3QQ",  walmartItemId: "374579542" },
    // Dental
    { productId: dental[0].id,      amazonPrice: 49.99, walmartPrice: 47.00, amazonUrl: "https://www.amazon.com/dp/B00AOHXKM4",  walmartUrl: "https://www.walmart.com/ip/Oral-B-Pro-1000-Rechargeable-Electric-Toothbrush/46669501",              asin: "B00AOHXKM4",  walmartItemId: "46669501" },
    { productId: dental[1].id,      amazonPrice: 59.99, walmartPrice: 54.00, amazonUrl: "https://www.amazon.com/dp/B00HFQQ0VU",  walmartUrl: "https://www.walmart.com/ip/Waterpik-Aquarius-Water-Flosser/46102722",                               asin: "B00HFQQ0VU",  walmartItemId: "46102722" },
    { productId: dental[2].id,      amazonPrice: 11.97, walmartPrice: 10.97, amazonUrl: "https://www.amazon.com/dp/B07C53D4NQ",  walmartUrl: "https://www.walmart.com/ip/Crest-Pro-Health-Gum-Detoxify-Deep-Clean-Toothpaste-4-8oz-2pk/406636056", asin: "B07C53D4NQ",  walmartItemId: "406636056" },
    { productId: dental[3].id,      amazonPrice: 9.97,  walmartPrice: 8.97,  amazonUrl: "https://www.amazon.com/dp/B001ETQ8GC",  walmartUrl: "https://www.walmart.com/ip/Listerine-Total-Care-Anticavity-Fluoride-Mouthwash-1-L/10784165",         asin: "B001ETQ8GC",  walmartItemId: "10784165" },
    { productId: dental[4].id,      amazonPrice: 49.95, walmartPrice: 44.00, amazonUrl: "https://www.amazon.com/dp/B078GVDB19",  walmartUrl: "https://www.walmart.com/ip/Philips-Sonicare-4100-Power-Toothbrush/284462755",                       asin: "B078GVDB19",  walmartItemId: "284462755" },
    // Devices
    { productId: devices[0].id,     amazonPrice: 79.99, walmartPrice: 74.00, amazonUrl: "https://www.amazon.com/dp/B07QR3B78F",  walmartUrl: "https://www.walmart.com/ip/OMRON-Platinum-Blood-Pressure-Monitor/178043859",                        asin: "B07QR3B78F",  walmartItemId: "178043859" },
    { productId: devices[1].id,     amazonPrice: 49.99, walmartPrice: 46.00, amazonUrl: "https://www.amazon.com/dp/B01N8UULZD",  walmartUrl: "https://www.walmart.com/ip/OMRON-Silver-Blood-Pressure-Monitor/56826452",                           asin: "B01N8UULZD",  walmartItemId: "56826452" },
    { productId: devices[2].id,     amazonPrice: 39.99, walmartPrice: 37.00, amazonUrl: "https://www.amazon.com/dp/B00R5XQO5U",  walmartUrl: "https://www.walmart.com/ip/Innovo-Deluxe-Fingertip-Pulse-Oximeter/167283950",                       asin: "B00R5XQO5U",  walmartItemId: "167283950" },
    { productId: devices[3].id,     amazonPrice: 19.99, walmartPrice: 18.47, amazonUrl: "https://www.amazon.com/dp/B00P4XQRPU",  walmartUrl: "https://www.walmart.com/ip/Zacurate-500DL-Fingertip-Pulse-Oximeter/284463891",                      asin: "B00P4XQRPU",  walmartItemId: "284463891" },
  ];

  await Promise.all(
    retailerPriceData.flatMap(({ productId, amazonPrice, walmartPrice, amazonUrl, walmartUrl, asin, walmartItemId }) => [
      prisma.productRetailerPrice.create({
        data: {
          productId,
          retailer: "amazon",
          price: amazonPrice,
          url: amazonUrl,
          retailerProductId: asin,
          available: true,
          manualEntry: false,
          scannedAt: null,
        },
      }),
      prisma.productRetailerPrice.create({
        data: {
          productId,
          retailer: "walmart",
          price: walmartPrice,
          url: walmartUrl,
          retailerProductId: walmartItemId,
          available: true,
          manualEntry: false,
          scannedAt: null,
        },
      }),
    ])
  );

  // ─── Patients ─────────────────────────────────────────────────────────────

  const patient1 = await prisma.user.create({
    data: {
      email: "emma.johnson@gmail.com",
      phone: "+14155551001",
      name: "Emma Johnson",
      role: Role.PATIENT,
      onboarded: true,
      emailVerified: new Date(),
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      email: "carlos.rodriguez@gmail.com",
      phone: "+14155551002",
      name: "Carlos Rodriguez",
      role: Role.PATIENT,
      onboarded: true,
      emailVerified: new Date(),
    },
  });

  const patient3 = await prisma.user.create({
    data: {
      email: "sophia.lee@yahoo.com",
      phone: "+14155551003",
      name: "Sophia Lee",
      role: Role.PATIENT,
      onboarded: true,
      emailVerified: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      phone: "+14155551004",
      name: "James Park",
      role: Role.PATIENT,
      onboarded: true,
    },
  });

  // ─── Recommendations ──────────────────────────────────────────────────────

  const { nanoid } = await import("nanoid");

  // Rec 1: Dermatologist → Emma — skincare routine (viewed)
  const rec1 = await prisma.recommendation.create({
    data: {
      token: nanoid(12),
      doctorId: doctorUser1.id,
      doctorProfileId: doctorProfile1.id,
      patientId: patient1.id,
      patientIdentifier: patient1.email ?? undefined,
      status: "VIEWED",
      note: "Hi Emma! Based on your consultation, I recommend this skincare routine to address dryness and early signs of aging. Use the cleanser morning and night, the retinol serum at night only, and SPF 46 every morning.",
      viewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: skincare[1].id, quantity: 1 }, // CeraVe Cleanser
          { productId: skincare[4].id, quantity: 1 }, // Neutrogena Retinol
          { productId: skincare[5].id, quantity: 1 }, // EltaMD SPF 46
          { productId: skincare[0].id, quantity: 1 }, // CeraVe Moisturizing Cream
        ],
      },
    },
  });

  // Rec 2: Dermatologist → Carlos — post-procedure kit (purchased)
  await prisma.recommendation.create({
    data: {
      token: nanoid(12),
      doctorId: doctorUser1.id,
      doctorProfileId: doctorProfile1.id,
      patientId: patient2.id,
      patientIdentifier: patient2.phone ?? undefined,
      status: "PURCHASED",
      note: "Carlos — here's your post-procedure care kit. Use the gentle cleanser twice daily, apply the moisturizer generously, and do not skip the SPF 100.",
      viewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      purchasedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: skincare[3].id, quantity: 1 }, // LRP Toleriane Cleanser
          { productId: skincare[0].id, quantity: 2 }, // CeraVe Moisturizing Cream x2
          { productId: skincare[2].id, quantity: 1 }, // LRP SPF 100
        ],
      },
    },
  });

  // Rec 3: Dermatologist → Emma — mixed: apps + wearable + supplements (sent)
  await prisma.recommendation.create({
    data: {
      token: nanoid(12),
      doctorId: doctorUser1.id,
      doctorProfileId: doctorProfile1.id,
      patientId: patient1.id,
      patientIdentifier: patient1.email ?? undefined,
      status: "SENT",
      note: "Emma, based on our conversation about your sleep and stress levels, I'd like you to try these alongside your skincare routine. The Calm app and Oura Ring will help you track and improve your sleep quality.",
      items: {
        create: [
          { productId: apps[0].id, quantity: 1 },      // Calm
          { productId: wearables[2].id, quantity: 1 }, // Oura Ring
          { productId: supplements[2].id, quantity: 1 }, // Magnesium
        ],
      },
    },
  });

  // Rec 4: Dentist → Sophia — oral care kit (sent)
  await prisma.recommendation.create({
    data: {
      token: nanoid(12),
      doctorId: doctorUser3.id,
      doctorProfileId: doctorProfile3.id,
      patientId: patient3.id,
      patientIdentifier: patient3.email ?? undefined,
      status: "SENT",
      note: "Sophia, great seeing you today! Here's the home care kit we discussed — the Sonicare and Waterpik combo will make a big difference for your gum health.",
      items: {
        create: [
          { productId: dental[4].id, quantity: 1 }, // Philips Sonicare
          { productId: dental[1].id, quantity: 1 }, // Waterpik
          { productId: dental[2].id, quantity: 1 }, // Crest Gum Detoxify
          { productId: dental[3].id, quantity: 1 }, // Listerine
        ],
      },
    },
  });

  // ─── Sample Order ─────────────────────────────────────────────────────────

  // Order for rec1 (Emma's skincare)
  const orderTotal = skincare[1].price + skincare[4].price + skincare[5].price + skincare[0].price;
  await prisma.order.create({
    data: {
      recommendationId: rec1.id,
      patientId: patient1.id,
      total: orderTotal,
      status: "PAID",
      stripeSessionId: "cs_test_sample123",
      items: {
        create: [
          { productId: skincare[1].id, quantity: 1, price: skincare[1].price },
          { productId: skincare[4].id, quantity: 1, price: skincare[4].price },
          { productId: skincare[5].id, quantity: 1, price: skincare[5].price },
          { productId: skincare[0].id, quantity: 1, price: skincare[0].price },
        ],
      },
    },
  });

  // ─── Sample Protocol ──────────────────────────────────────────────────────

  await prisma.protocol.create({
    data: {
      doctorProfileId: doctorProfile1.id,
      name: "Derm Essentials Starter Kit",
      description: "Core skincare products for patients starting a derm-recommended routine: gentle cleansing, barrier repair, sun protection.",
      items: {
        create: [
          { productId: skincare[1].id, quantity: 1 }, // CeraVe Cleanser
          { productId: skincare[0].id, quantity: 1 }, // CeraVe Moisturizing Cream
          { productId: skincare[5].id, quantity: 1 }, // EltaMD SPF 46
          { productId: supplements[5].id, quantity: 1 }, // Vital Proteins Collagen
        ],
      },
    },
  });

  // ─── System Kits ──────────────────────────────────────────────────────────

  const findProduct = async (name: string): Promise<string> => {
    const p = await prisma.product.findFirst({ where: { name }, select: { id: true } });
    if (!p) throw new Error(`Seed: product not found: "${name}"`);
    return p.id;
  };

  // Dermatology
  await prisma.kit.create({ data: { name: "Acne Starter Kit", specialty: "Dermatology", items: { create: [
    { productId: await findProduct("CeraVe Hydrating Facial Cleanser 16oz"), order: 0 },
    { productId: await findProduct("La Roche-Posay Anthelios Melt-in Milk Sunscreen SPF 100 3oz"), order: 1 },
    { productId: await findProduct("Calm — Mental Wellness & Sleep"), order: 2 },
  ] } } });
  await prisma.kit.create({ data: { name: "Post-Procedure Kit", specialty: "Dermatology", items: { create: [
    { productId: await findProduct("CeraVe Moisturizing Cream 19oz"), order: 0 },
    { productId: await findProduct("Neutrogena Rapid Wrinkle Repair Retinol Cream 1.7oz"), order: 1 },
    { productId: await findProduct("EltaMD UV Clear Broad-Spectrum SPF 46 1.7oz"), order: 2 },
  ] } } });

  // Dentistry
  await prisma.kit.create({ data: { name: "New Patient Kit", specialty: "Dentistry", items: { create: [
    { productId: await findProduct("Oral-B Pro 1000 Electric Toothbrush"), order: 0 },
    { productId: await findProduct("Waterpik Aquarius Water Flosser WP-660"), order: 1 },
    { productId: await findProduct("Crest Pro-Health Gum Detoxify Toothpaste 4.8oz"), order: 2 },
    { productId: await findProduct("Listerine Total Care Anticavity Mouthwash 1L"), order: 3 },
  ] } } });
  await prisma.kit.create({ data: { name: "Periodontal Care Kit", specialty: "Dentistry", items: { create: [
    { productId: await findProduct("Philips Sonicare ProtectiveClean 4100 Electric Toothbrush"), order: 0 },
    { productId: await findProduct("Waterpik Aquarius Water Flosser WP-660"), order: 1 },
    { productId: await findProduct("Listerine Total Care Anticavity Mouthwash 1L"), order: 2 },
  ] } } });

  // Primary Care
  await prisma.kit.create({ data: { name: "Wellness Kit", specialty: "Primary Care", items: { create: [
    { productId: await findProduct("Nature Made Vitamin D3 2000 IU"), order: 0 },
    { productId: await findProduct("Pure Encapsulations Magnesium Glycinate 90 caps"), order: 1 },
    { productId: await findProduct("Physician's Choice Probiotics 60 Billion CFU 30ct"), order: 2 },
    { productId: await findProduct("MyFitnessPal — Calorie & Nutrition Tracker"), order: 3 },
  ] } } });
  await prisma.kit.create({ data: { name: "Heart Health Starter", specialty: "Primary Care", items: { create: [
    { productId: await findProduct("OMRON Platinum Blood Pressure Monitor BP5450"), order: 0 },
    { productId: await findProduct("Nordic Naturals Ultimate Omega 90 softgels"), order: 1 },
  ] } } });

  // Cardiology
  await prisma.kit.create({ data: { name: "Heart Health Starter", specialty: "Cardiology", items: { create: [
    { productId: await findProduct("OMRON Platinum Blood Pressure Monitor BP5450"), order: 0 },
    { productId: await findProduct("Nordic Naturals Ultimate Omega 90 softgels"), order: 1 },
  ] } } });
  await prisma.kit.create({ data: { name: "Home Monitoring Kit", specialty: "Cardiology", items: { create: [
    { productId: await findProduct("OMRON Silver Blood Pressure Monitor BP5250"), order: 0 },
    { productId: await findProduct("Innovo Deluxe Fingertip Pulse Oximeter iP900AP"), order: 1 },
    { productId: await findProduct("Whoop 4.0"), order: 2 },
  ] } } });

  console.log("System kits seeded: 8 kits across 4 specialties");

  // ─── Done ─────────────────────────────────────────────────────────────────

  console.log("Seed complete!");
  console.log(`Created: 2 practices, 3 doctors, 35 products, 4 patients, 4 recommendations, 1 order, 1 protocol`);
  console.log(`  Supplements: ${supplements.length}`);
  console.log(`  Skincare:    ${skincare.length}`);
  console.log(`  Dental:      ${dental.length}`);
  console.log(`  Devices:     ${devices.length}`);
  console.log(`  Apps:        ${apps.length}`);
  console.log(`  Wearables:   ${wearables.length}`);
  console.log(`  Retailer prices: ${retailerPriceData.length * 2} (Amazon + Walmart for physical products)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
