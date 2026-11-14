"use client";

import Image from "next/image";
import { useId, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { uploadImageAction } from "@/app/admin/uploads/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const FILE_TOO_LARGE = "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.";
const UPLOAD_FAILED = "بارگذاری تصویر ناموفق بود. لطفاً دوباره تلاش کنید.";

export type UploadedImage = {
  url: string;
  alt?: string;
};

type ImageUploaderProps = {
  name: string;
  label: string;
  defaultValue?: (string | UploadedImage)[];
  multiple?: boolean;
  maxFiles?: number;
  error?: string;
  className?: string;
  reorderable?: boolean;
  altName?: string;
};

type ImageItem = {
  url: string;
  alt: string;
};

function toItems(defaultValue: (string | UploadedImage)[]): ImageItem[] {
  return defaultValue
    .map((item) =>
      typeof item === "string"
        ? { url: item, alt: "" }
        : { url: item.url, alt: item.alt ?? "" }
    )
    .filter((item) => item.url.length > 0);
}

export function ImageUploader({
  name,
  label,
  defaultValue = [],
  multiple = false,
  maxFiles = 10,
  error,
  className,
  reorderable = false,
  altName,
}: ImageUploaderProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const [items, setItems] = useState<ImageItem[]>(() => toItems(defaultValue));
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const visibleError = localError ?? error ?? null;
  const limit = multiple ? Math.max(1, maxFiles) : 1;
  const extended = reorderable || Boolean(altName);

  function removeAt(index: number) {
    if (pending) {
      return;
    }

    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setLocalError(null);
  }

  function moveAt(index: number, direction: -1 | 1) {
    if (pending) {
      return;
    }

    setItems((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);

      next.splice(target, 0, item);

      return next;
    });
  }

  function setAltAt(index: number, alt: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, alt } : item
      )
    );
  }

  async function uploadFiles(fileList: FileList | File[]) {
    if (pending) {
      return;
    }

    const files = Array.from(fileList);
    const available = multiple ? Math.max(0, limit - items.length) : 1;

    if (files.length === 0) {
      return;
    }

    if (available === 0) {
      setLocalError(
        multiple
          ? `حداکثر ${limit} تصویر می‌توانید بارگذاری کنید.`
          : "برای جایگزینی، ابتدا تصویر فعلی را حذف کنید."
      );
      return;
    }

    const selected = files.slice(0, available);
    const tooLarge = selected.find((file) => file.size > MAX_UPLOAD_BYTES);

    if (tooLarge) {
      setLocalError(FILE_TOO_LARGE);
      return;
    }

    setPending(true);
    setLocalError(null);

    const uploaded: ImageItem[] = [];

    try {
      for (const file of selected) {
        const data = new FormData();
        data.append("file", file);

        const result = await uploadImageAction(data);

        if (!result.ok) {
          setLocalError(result.message);
          break;
        }

        uploaded.push({ url: result.url, alt: "" });
      }

      if (uploaded.length > 0) {
        setItems((current) =>
          multiple
            ? [...current, ...uploaded].slice(0, limit)
            : uploaded.slice(0, 1)
        );
      }
    } catch {
      setLocalError(UPLOAD_FAILED);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm font-medium text-dark">{label}</p>

      {items.map((item, index) => (
        <input key={`${item.url}-${index}`} type="hidden" name={name} value={item.url} />
      ))}

      <div
        onDragOver={(event) => {
          event.preventDefault();

          if (!pending) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-lg border border-dashed border-border bg-card/60 transition-colors motion-reduce:transition-none",
          dragging ? "border-primary bg-secondary/50" : null,
          pending ? "opacity-70" : null
        )}
      >
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-8 text-center focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          {pending ? (
            <Loader2
              className="size-6 animate-spin text-primary motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <ImagePlus className="size-6 text-primary" aria-hidden="true" />
          )}
          <span className="text-sm font-medium text-dark">
            {pending ? "در حال بارگذاری تصویر..." : "انتخاب یا رها کردن تصویر"}
          </span>
          <span id={hintId} className="text-xs leading-5 text-muted-foreground">
            JPEG، PNG یا WebP، حداکثر ۵ مگابایت
          </span>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={multiple}
            disabled={pending}
            aria-label={label}
            aria-describedby={hintId}
            className="sr-only"
            onChange={(event) => {
              const files = event.target.files;
              event.target.value = "";

              if (files) {
                void uploadFiles(files);
              }
            }}
          />
        </label>
      </div>

      {items.length > 0 && extended ? (
        <ul className="flex flex-wrap gap-3">
          {items.map((item, index) => (
            <li
              key={`${item.url}-preview`}
              className="flex w-36 flex-col gap-2 rounded-md border border-border bg-card p-2"
            >
              <div className="relative">
                <Image
                  src={item.url}
                  alt={`پیش‌نمایش تصویر ${index + 1}`}
                  width={112}
                  height={112}
                  unoptimized
                  className="aspect-square w-full rounded-md border border-border object-cover"
                />
                {multiple && index === 0 ? (
                  <span className="absolute start-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    تصویر اصلی
                  </span>
                ) : null}
              </div>

              {altName ? (
                <input
                  type="text"
                  name={altName}
                  value={item.alt}
                  onChange={(event) => setAltAt(index, event.target.value)}
                  placeholder="متن جایگزین"
                  aria-label={`متن جایگزین تصویر ${index + 1}`}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              ) : null}

              <div className="flex items-center justify-between gap-1">
                {reorderable ? (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={pending || index === 0}
                      aria-label={`انتقال تصویر ${index + 1} به بالا`}
                      onClick={() => moveAt(index, -1)}
                    >
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={pending || index === items.length - 1}
                      aria-label={`انتقال تصویر ${index + 1} به پایین`}
                      onClick={() => moveAt(index, 1)}
                    >
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <span />
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={pending}
                  aria-label={`حذف تصویر ${index + 1}`}
                  onClick={() => removeAt(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 && !extended ? (
        <ul className="flex flex-wrap gap-3">
          {items.map((item, index) => (
            <li key={`${item.url}-preview`} className="relative">
              <Image
                src={item.url}
                alt={`پیش‌نمایش تصویر ${index + 1}`}
                width={112}
                height={112}
                unoptimized
                className="size-28 rounded-md border border-border object-cover"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={pending}
                aria-label={`حذف تصویر ${index + 1}`}
                onClick={() => removeAt(index)}
                className="absolute -top-2 -end-2 rounded-full bg-card"
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div aria-live="polite" aria-atomic="true">
        {visibleError ? (
          <p role="alert" className="text-xs leading-5 text-destructive">
            {visibleError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
