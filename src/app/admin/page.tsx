import type { Metadata } from "next";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "پنل مدیریت | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <EmptyState
        className="w-full max-w-xl"
        title="پنل مدیریت"
        description="این بخش در فاز بعدی تکمیل می‌شود."
      />
    </Container>
  );
}
