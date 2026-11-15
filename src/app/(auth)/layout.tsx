import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="flex flex-1 items-center justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">{children}</div>
    </Container>
  );
}
