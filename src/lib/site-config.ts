const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export type SiteConfig = {
  name: string;
  shortName: string;
  nameFa: string;
  brandLabel: string;
  tagline: string;
  description: string;
  url: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  instagramHandle: string;
  workingHours: string;
  returnWindowDays: number;
  deliveryTimeText: string;
};

/**
 * Shared brand, contact and policy values.
 *
 * Every value marked with SAMPLE is a placeholder. Replace it with the real
 * business value before launch; pages and the footer read from this file so a
 * single change updates the whole storefront.
 */
export const siteConfig = {
  name: "MONO ACCESSORY",
  shortName: "MONO",
  nameFa: "مونو اکسسوری",
  brandLabel: "اکسسوری",
  tagline: "اکسسوری‌های مینیمال برای روزهای واقعی", // SAMPLE: final brand tagline
  description:
    "فروشگاه آنلاین جواهرات استیل، اکسسوری و عینک؛ طراحی مینیمال برای زنان امروز.",
  url: rawSiteUrl,
  phone: "+982100000000", // SAMPLE: real support phone in international format
  phoneDisplay: "۰۲۱ ۰۰۰ ۰۰۰۰", // SAMPLE: real support phone as displayed
  email: "hello@mono.example", // SAMPLE: real support email
  address: "تهران، ایران", // SAMPLE: real postal address
  instagramHandle: "mono.accessory", // SAMPLE: real Instagram handle without @
  workingHours: "شنبه تا پنجشنبه، ۱۰ تا ۱۸", // SAMPLE: real support hours
  returnWindowDays: 7,
  deliveryTimeText: "۲ تا ۵ روز کاری",
} as const satisfies SiteConfig;

export const siteUrl = new URL(siteConfig.url);

export const instagramUrl = `https://instagram.com/${siteConfig.instagramHandle}`;

export const instagramDisplay = `@${siteConfig.instagramHandle}`;
