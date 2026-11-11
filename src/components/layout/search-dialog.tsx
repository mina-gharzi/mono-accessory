"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = value.trim();
    setOpen(false);
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="جستجو">
          <Search className="size-5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>جستجو در فروشگاه</DialogTitle>
          <DialogDescription>
            نام محصول، دسته یا کالکشن مورد نظر را وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            autoFocus
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="مثلاً گردنبند استیل..."
            aria-label="عبارت جستجو"
            className="h-11"
          />
          <Button type="submit" className="h-11">
            جستجو
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
