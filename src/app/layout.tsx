import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { HeaderSkeleton } from "@/components/layout/header-skeleton";
import { CartSheetProvider } from "@/components/cart/cart-sheet";
import { MotionProvider } from "@/components/motion/motion-provider";
import { RtlProvider } from "@/components/providers/rtl-provider";
import { WishlistSeed } from "@/components/wishlist/wishlist-seed";
import { pinar } from "@/lib/fonts";
import { instagramUrl, siteConfig, siteUrl } from "@/lib/site-config";
import "./globals.css";

const baseUrl = siteConfig.url.replace(/\/$/, "");

const siteTitle = "مونو اکسسوری | جواهرات استیل و اکسسوری";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteConfig.name,
  title: siteTitle,
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: siteConfig.name,
    title: siteTitle,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteConfig.description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: siteConfig.name,
      url: baseUrl,
      email: siteConfig.email,
      telephone: siteConfig.phone,
      address: {
        "@type": "PostalAddress",
        addressCountry: "IR",
        addressLocality: siteConfig.address,
      },
      sameAs: [instagramUrl],
    },
    {
      "@type": "WebSite",
      name: siteConfig.name,
      url: baseUrl,
      inLanguage: "fa-IR",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/shop?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${pinar.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <RtlProvider>
          <MotionProvider>
            <Suspense fallback={null}>
              <WishlistSeed />
            </Suspense>
            <CartSheetProvider>
              <Suspense fallback={<HeaderSkeleton />}>
                <Header />
              </Suspense>
              <main className="flex flex-1 flex-col">{children}</main>
              <Footer />
            </CartSheetProvider>
          </MotionProvider>
        </RtlProvider>
      </body>
    </html>
  );
}
