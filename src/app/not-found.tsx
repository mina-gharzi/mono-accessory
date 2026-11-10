import Link from "next/link";
import { Compass } from "lucide-react";
import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex flex-1 items-center justify-center py-20">
      <EmptyState
        className="w-full max-w-xl"
        icon={<Compass className="size-5" />}
        title="این صفحه پیدا نشد"
        description="ممکن است آدرس تغییر کرده باشد یا صفحه هنوز آماده نشده است."
        action={
          <Button asChild>
            <Link href="/">بازگشت به صفحهٔ اصلی</Link>
          </Button>
        }
      />
    </Container>
  );
}
