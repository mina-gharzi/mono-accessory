import type { Metadata } from "next";
import localFont from "next/font/local";
import { RtlProvider } from "@/components/providers/rtl-provider";
import "./globals.css";

const pinar = localFont({
  src: [
    {
      path: "../../public/fonts/PINAR-DS3-REGULAR.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/PINAR-MEDIUM.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/PINAR-BOLD.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/PINAR-DS3-EXTRABOLD2.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-pinar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مونو اکسسوری | جواهرات استیل و اکسسوری",
  description:
    "فروشگاه آنلاین جواهرات استیل، اکسسوری و عینک؛ طراحی مینیمال برای زنان امروز.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${pinar.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RtlProvider>{children}</RtlProvider>
      </body>
    </html>
  );
}
