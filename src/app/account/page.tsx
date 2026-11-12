import type { Metadata } from "next";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "حساب کاربری | مونو اکسسوری",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <EmptyState
        className="w-full max-w-xl"
        title="حساب کاربری"
        description="این بخش در فاز بعدی تکمیل می‌شود."
      />
    </Container>
  );
}
