import localFont from "next/font/local";

export const pinar = localFont({
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
