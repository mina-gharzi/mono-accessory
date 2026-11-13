import { Construction } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <EmptyState
      icon={<Construction className="size-5" />}
      title={`${title} هنوز ساخته نشده است`}
      description={
        description ??
        "این بخش در فاز بعدی پروژه تکمیل می‌شود و فعلاً هیچ داده یا قابلیتی ندارد."
      }
    />
  );
}
