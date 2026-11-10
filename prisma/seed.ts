import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/server/db";

type SeedVariant = {
  color: string;
  colorCode: string;
  model?: string;
  stock: number;
};

type SeedProduct = {
  code: string;
  name: string;
  slug: string;
  legacySlug?: string;
  description: string;
  specs: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  categorySlug: string;
  isFeatured?: boolean;
  soldCount: number;
  imageCount: number;
  image?: string;
  variants: SeedVariant[];
};

type SeedCollection = {
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  productSlugs: string[];
};

type SeedCategory = {
  name: string;
  slug: string;
  image: string;
  sortOrder: number;
};

const categories: SeedCategory[] = [
  {
    name: "انگشتر",
    slug: "rings",
    image: "/images/categories/category-rings.jpg",
    sortOrder: 1,
  },
  {
    name: "گوشواره",
    slug: "earrings",
    image: "/images/categories/category-earrings.jpg",
    sortOrder: 2,
  },
  {
    name: "گردنبند",
    slug: "necklaces",
    image: "/images/categories/category-necklaces.jpg",
    sortOrder: 3,
  },
  {
    name: "عینک آفتابی",
    slug: "sunglasses",
    image: "/images/categories/category-sunglass.jpg",
    sortOrder: 4,
  },
  {
    name: "اکسسوری",
    slug: "accessories",
    image: "",
    sortOrder: 5,
  },
];

// Previous seed slugs, renamed in place so re-running the seed does not leave
// duplicate categories behind.
const categorySlugAliases: Record<string, string> = {
  rings: "steel-jewelry",
  earrings: "costume-jewelry",
  sunglasses: "glasses",
};

const products: SeedProduct[] = [
  {
    code: "MN-101",
    name: "ست گردنبند استیل",
    slug: "necklace-steel-gold",
    description:
      "ست دو گردنبند استیل با آبکاری طلایی؛ هماهنگ، سبک و مناسب استفادهٔ روزمره.",
    specs: {
      جنس: "استیل ضدزنگ",
      آبکاری: "طلایی",
      شامل: "دو گردنبند",
      طول: "۴۰ و ۴۵ سانتی‌متر",
      "بسته‌بندی": "جعبهٔ هدیه",
    },
    price: 1280000,
    compareAtPrice: 1590000,
    categorySlug: "necklaces",
    isFeatured: true,
    soldCount: 148,
    imageCount: 1,
    image: "/images/products/product.jpg",
    variants: [
      { color: "طلایی", colorCode: "GD", stock: 12 },
      { color: "نقره‌ای", colorCode: "SL", stock: 7 },
    ],
  },
  {
    code: "MN-102",
    name: "گردنبند لایه‌ای استیل",
    slug: "necklace-steel-layered",
    legacySlug: "bracelet-steel-stone",
    description:
      "گردنبند سه‌لایهٔ استیل با آبکاری نقره‌ای؛ طراحی سبک و روزمره برای استایل مینیمال.",
    specs: {
      جنس: "استیل ضدزنگ",
      آبکاری: "نقره‌ای",
      "تعداد لایه": "۳",
      طول: "۴۵ سانتی‌متر",
      وزن: "۱۰ گرم",
    },
    price: 980000,
    categorySlug: "necklaces",
    isFeatured: true,
    soldCount: 96,
    imageCount: 1,
    image: "/images/products/product1.jpg",
    variants: [
      { color: "طلایی", colorCode: "GD", stock: 9 },
      { color: "نقره‌ای", colorCode: "SL", stock: 4 },
      { color: "رزگلد", colorCode: "RG", stock: 6 },
    ],
  },
  {
    code: "MN-103",
    name: "انگشتر استیل مینیمال",
    slug: "ring-steel-minimal",
    description:
      "انگشتر ساده و قابل تنظیم با جنس استیل؛ گزینه‌ای بی‌زمان برای استفادهٔ هر روز.",
    specs: {
      جنس: "استیل ضدزنگ",
      سایز: "قابل تنظیم",
      وزن: "۵ گرم",
    },
    price: 620000,
    categorySlug: "rings",
    soldCount: 210,
    imageCount: 2,
    variants: [
      { color: "طلایی", colorCode: "GD", stock: 18 },
      { color: "نقره‌ای", colorCode: "SL", stock: 11 },
    ],
  },
  {
    code: "MN-104",
    name: "گوشواره حلقه‌ای استیل",
    slug: "earrings-steel-hoop",
    description:
      "گوشوارهٔ حلقه‌ای سبک با آبکاری مقاوم؛ مناسب استفادهٔ روزمره و مهمانی.",
    specs: {
      جنس: "استیل ضدزنگ",
      قطر: "۳ سانتی‌متر",
      وزن: "۶ گرم",
    },
    price: 540000,
    compareAtPrice: 690000,
    categorySlug: "earrings",
    soldCount: 320,
    imageCount: 3,
    variants: [
      { color: "طلایی", colorCode: "GD", stock: 25 },
      { color: "نقره‌ای", colorCode: "SL", stock: 14 },
    ],
  },
  {
    code: "MC-201",
    name: "گوشواره مروارید مصنوعی",
    slug: "earrings-pearl",
    description:
      "گوشوارهٔ مرواریدی با ظاهری ظریف و کلاسیک؛ انتخابی مناسب برای مهمانی و هدیه.",
    specs: {
      جنس: "برنج با آبکاری طلا",
      مروارید: "مصنوعی",
      وزن: "۴ گرم",
    },
    price: 390000,
    categorySlug: "earrings",
    isFeatured: true,
    soldCount: 275,
    imageCount: 2,
    variants: [
      { color: "طلایی", colorCode: "GD", stock: 30 },
      { color: "نقره‌ای", colorCode: "SL", stock: 16 },
    ],
  },
  {
    code: "MC-202",
    name: "گردنبند لایه‌ای طلایی",
    slug: "necklace-layered-gold",
    description:
      "گردنبند سه‌لایه با آبکاری طلایی و طراحی روز؛ جلوه‌ای ساده و در عین حال چشم‌نواز.",
    specs: {
      جنس: "برنج با آبکاری طلا",
      "تعداد لایه": "۳",
      طول: "۴۰ سانتی‌متر",
    },
    price: 460000,
    categorySlug: "necklaces",
    soldCount: 132,
    imageCount: 3,
    variants: [{ color: "طلایی", colorCode: "GD", stock: 21 }],
  },
  {
    code: "MC-203",
    name: "دستبند بافت رزگلد",
    slug: "bracelet-rosegold",
    description:
      "دستبند بافت با آبکاری رزگلد و بند قابل تنظیم؛ مناسب استایل‌های روزمره.",
    specs: {
      جنس: "برنج با آبکاری رزگلد",
      طول: "۱۶ سانتی‌متر",
      وزن: "۹ گرم",
    },
    price: 350000,
    categorySlug: "accessories",
    soldCount: 88,
    imageCount: 2,
    variants: [{ color: "رزگلد", colorCode: "RG", stock: 6 }],
  },
  {
    code: "MC-204",
    name: "ست گردنبند و گوشواره",
    slug: "set-necklace-earrings",
    description:
      "ست هماهنگ گردنبند و گوشواره با طراحی ظریف؛ گزینه‌ای آماده برای هدیه.",
    specs: {
      جنس: "برنج با آبکاری طلا",
      شامل: "گردنبند و گوشواره",
      "طول گردنبند": "۴۲ سانتی‌متر",
    },
    price: 720000,
    compareAtPrice: 890000,
    categorySlug: "necklaces",
    isFeatured: true,
    soldCount: 64,
    imageCount: 3,
    variants: [{ color: "طلایی", colorCode: "GD", stock: 8 }],
  },
  {
    code: "MG-301",
    name: "عینک آفتابی مستطیلی",
    slug: "sunglasses-rectangle",
    description:
      "عینک آفتابی با فریم مستطیلی و عدسی UV400؛ همراه با کیف و دستمال مخصوص.",
    specs: {
      فریم: "استات",
      عدسی: "UV400",
      عرض: "۱۴ سانتی‌متر",
      شامل: "کیف و دستمال",
    },
    price: 1450000,
    categorySlug: "sunglasses",
    isFeatured: true,
    soldCount: 73,
    imageCount: 3,
    variants: [
      { color: "مشکی", colorCode: "BK", stock: 6 },
      { color: "قهوه‌ای", colorCode: "BR", stock: 3 },
    ],
  },
  {
    code: "MG-302",
    name: "عینک آفتابی گرد",
    slug: "sunglasses-round",
    description:
      "عینک آفتابی گرد با استایل رترو و عدسی محافظ UV؛ سبک و راحت.",
    specs: {
      فریم: "استات",
      عدسی: "UV400",
      عرض: "۱۳.۵ سانتی‌متر",
      شامل: "کیف و دستمال",
    },
    price: 1250000,
    categorySlug: "sunglasses",
    soldCount: 51,
    imageCount: 2,
    variants: [
      { color: "مشکی", colorCode: "BK", stock: 5 },
      { color: "طلایی", colorCode: "GD", stock: 0 },
    ],
  },
  {
    code: "MG-303",
    name: "عینک طبی فریم فلزی",
    slug: "eyeglasses-metal",
    description:
      "فریم فلزی سبک با عدسی ضد انعکاس؛ مناسب استفادهٔ روزانه و محیط کار.",
    specs: {
      فریم: "فلز",
      عدسی: "ضد انعکاس",
      عرض: "۱۳.۵ سانتی‌متر",
    },
    price: 1680000,
    categorySlug: "sunglasses",
    soldCount: 39,
    imageCount: 2,
    variants: [
      { color: "نقره‌ای", colorCode: "SL", stock: 4 },
      { color: "طلایی", colorCode: "GD", stock: 2 },
    ],
  },
  {
    code: "MG-304",
    name: "عینک آفتابی کت‌آی",
    slug: "sunglasses-cateye",
    description:
      "عینک آفتابی کت‌آی با فریم ظریف و عدسی UV400؛ ترکیبی از کلاسیک و مدرن.",
    specs: {
      فریم: "استات",
      عدسی: "UV400",
      عرض: "۱۴ سانتی‌متر",
      شامل: "کیف و دستمال",
    },
    price: 1390000,
    compareAtPrice: 1690000,
    categorySlug: "sunglasses",
    soldCount: 118,
    imageCount: 3,
    variants: [
      { color: "مشکی", colorCode: "BK", stock: 9 },
      { color: "لاک‌پشتی", colorCode: "TR", stock: 5 },
    ],
  },
  {
    code: "MA-401",
    name: "کیف دوشی کوچک",
    slug: "bag-shoulder-mini",
    description:
      "کیف دوشی کوچک با چرم مصنوعی و بند قابل تنظیم؛ مناسب استفادهٔ روزمره.",
    specs: {
      جنس: "چرم مصنوعی",
      ابعاد: "۲۰ × ۱۴ × ۶ سانتی‌متر",
      بند: "قابل تنظیم",
    },
    price: 1190000,
    categorySlug: "accessories",
    soldCount: 87,
    imageCount: 3,
    variants: [
      { color: "مشکی", colorCode: "BK", stock: 7 },
      { color: "کرم", colorCode: "CR", stock: 3 },
    ],
  },
  {
    code: "MA-402",
    name: "شال نخی مینیمال",
    slug: "scarf-cotton",
    description:
      "شال نخی سبک با بافت ساده و رنگ‌های آرام؛ مناسب چهار فصل.",
    specs: {
      جنس: "نخ پنبه",
      ابعاد: "۱۸۰ × ۷۰ سانتی‌متر",
      فصل: "چهارفصل",
    },
    price: 420000,
    categorySlug: "accessories",
    soldCount: 194,
    imageCount: 2,
    variants: [
      { color: "کرم", colorCode: "CR", stock: 22 },
      { color: "زرشکی", colorCode: "BG", stock: 14 },
      { color: "سبز مریم‌گلی", colorCode: "SG", stock: 9 },
    ],
  },
  {
    code: "MA-403",
    name: "ساعت مچی بند فلزی",
    slug: "watch-metal",
    description:
      "ساعت مچی با بند استیل و صفحهٔ مینا؛ طراحی مینیمال برای استفادهٔ روزانه.",
    specs: {
      بند: "استیل ضدزنگ",
      صفحه: "مینا",
      قطر: "۳۴ میلی‌متر",
      "ضدآب": "۳ اتمسفر",
    },
    price: 1890000,
    compareAtPrice: 2290000,
    categorySlug: "accessories",
    isFeatured: true,
    soldCount: 42,
    imageCount: 3,
    variants: [
      { color: "نقره‌ای", colorCode: "SL", stock: 4 },
      { color: "طلایی", colorCode: "GD", stock: 2 },
    ],
  },
  {
    code: "MA-404",
    name: "گیره مو فلزی",
    slug: "hair-clip-metal",
    description:
      "گیره مو فلزی با طراحی ساده و مقاوم؛ مناسب جمع‌کردن سریع مو.",
    specs: {
      جنس: "استیل ضدزنگ",
      طول: "۷ سانتی‌متر",
      وزن: "۱۲ گرم",
    },
    price: 180000,
    categorySlug: "accessories",
    soldCount: 356,
    imageCount: 2,
    variants: [
      { color: "طلایی", colorCode: "GD", stock: 40 },
      { color: "نقره‌ای", colorCode: "SL", stock: 28 },
    ],
  },
];

const collections: SeedCollection[] = [
  {
    name: "پرفروش‌ها",
    slug: "bestsellers",
    description:
      "محبوب‌ترین قطعات مونو بر اساس انتخاب مشتریان؛ از گردنبند استیل تا اکسسوری روزمره.",
    image: "/images/collections/collection-necklaces.jpg",
    isActive: true,
    productSlugs: [
      "necklace-steel-gold",
      "earrings-steel-hoop",
      "earrings-pearl",
      "hair-clip-metal",
      "necklace-layered-gold",
    ],
  },
  {
    name: "تازه‌ها",
    slug: "new-arrivals",
    description:
      "جدیدترین قطعاتی که به مجموعهٔ مونو اضافه شده‌اند؛ طراحی‌های تازه برای فصل جدید.",
    image: "/images/collections/collection-sunglass.jpg",
    isActive: true,
    productSlugs: [
      "sunglasses-cateye",
      "bag-shoulder-mini",
      "watch-metal",
      "set-necklace-earrings",
      "necklace-steel-layered",
    ],
  },
  {
    name: "هدیه",
    slug: "gifts",
    description:
      "انتخاب‌هایی آماده برای هدیه‌دادن؛ از ست‌های هماهنگ تا ساعت و گردنبند استیل.",
    image: "/images/collections/collection-other-accessory.jpg",
    isActive: true,
    productSlugs: [
      "set-necklace-earrings",
      "watch-metal",
      "necklace-steel-gold",
      "earrings-pearl",
      "scarf-cotton",
    ],
  },
];

const settings = [
  { key: "shippingCost", value: "60000" },
  { key: "freeShippingThreshold", value: "1500000" },
];

async function upsertCategory(category: SeedCategory) {
  const existing = await prisma.category.findUnique({
    where: { slug: category.slug },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: {
        name: category.name,
        image: category.image,
        sortOrder: category.sortOrder,
      },
    });
  }

  const alias = categorySlugAliases[category.slug];
  const legacy = alias
    ? await prisma.category.findUnique({ where: { slug: alias } })
    : null;

  if (legacy) {
    return prisma.category.update({
      where: { id: legacy.id },
      data: {
        name: category.name,
        slug: category.slug,
        image: category.image,
        sortOrder: category.sortOrder,
      },
    });
  }

  return prisma.category.create({ data: category });
}

async function main() {
  const adminMobile = process.env.ADMIN_MOBILE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminMobile || !adminPassword) {
    throw new Error("ADMIN_MOBILE and ADMIN_PASSWORD must be set");
  }

  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { mobile: adminMobile },
    update: {
      passwordHash,
      name: "مدیر مونو",
      role: "ADMIN",
    },
    create: {
      mobile: adminMobile,
      passwordHash,
      name: "مدیر مونو",
      role: "ADMIN",
    },
  });

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const row = await upsertCategory(category);

    categoryIds.set(category.slug, row.id);
  }

  const productIds = new Map<string, string>();

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Unknown category: ${product.categorySlug}`);
    }

    const data = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      specs: product.specs,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      categoryId,
      isFeatured: product.isFeatured ?? false,
      isActive: true,
      soldCount: product.soldCount,
    };

    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });
    const legacy =
      !existing && product.legacySlug
        ? await prisma.product.findUnique({
            where: { slug: product.legacySlug },
          })
        : null;
    const current = existing ?? legacy;

    const row = current
      ? await prisma.product.update({
          where: { id: current.id },
          data,
        })
      : await prisma.product.create({ data });

    productIds.set(product.slug, row.id);

    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    await prisma.productImage.createMany({
      data: Array.from({ length: product.imageCount }, (_, index) => ({
        productId: row.id,
        url:
          product.image && index === 0
            ? product.image
            : `/images/products/${product.slug}-${index + 1}.jpg`,
        alt: `${product.name} - تصویر ${index + 1}`,
        sortOrder: index,
      })),
    });

    for (const variant of product.variants) {
      const sku = `${product.code}-${variant.colorCode}`;

      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          productId: row.id,
          color: variant.color,
          model: variant.model ?? null,
          stock: variant.stock,
        },
        create: {
          productId: row.id,
          sku,
          color: variant.color,
          model: variant.model ?? null,
          stock: variant.stock,
        },
      });
    }
  }

  for (const collection of collections) {
    const row = await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        description: collection.description,
        image: collection.image,
        isActive: collection.isActive,
      },
      create: {
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        image: collection.image,
        isActive: collection.isActive,
      },
    });

    const connect = collection.productSlugs.map((slug) => {
      const id = productIds.get(slug);

      if (!id) {
        throw new Error(`Unknown product: ${slug}`);
      }

      return { id };
    });

    await prisma.collection.update({
      where: { id: row.id },
      data: { products: { set: connect } },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
