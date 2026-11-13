"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImageAction } from "@/app/admin/uploads/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const FILE_TOO_LARGE = "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.";
const UPLOAD_FAILED = "بارگذاری تصویر ناموفق بود. لطفاً دوباره تلاش کنید.";

type ImageUploaderProps = {
  name: string;
  label: string;
  defaultValue?: string[];
  multiple?: boolean;
  maxFiles?: number;
  error?: string;
  className?: string;
};

export function ImageUploader({
  name,
  label,
  defaultValue = [],
  multiple = false,
  maxFiles = 10,
  error,
  className,
}: ImageUploaderProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const [urls, setUrls] = useState<string[]>(() =>
    defaultValue.filter((url) => url.length > 0)
  );
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const visibleError = localError ?? error ?? null;
  const limit = multiple ? Math.max(1, maxFiles) : 1;

  function removeAt(index: number) {
    if (pending) {
      return;
    }

    setUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setLocalError(null);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    if (pending) {
      return;
    }

    const files = Array.from(fileList);
    const available = multiple ? Math.max(0, limit - urls.length) : 1;

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

    const uploaded: string[] = [];

    try {
      for (const file of selected) {
        const data = new FormData();
        data.append("file", file);

        const result = await uploadImageAction(data);

        if (!result.ok) {
          setLocalError(result.message);
          break;
        }

        uploaded.push(result.url);
      }

      if (uploaded.length > 0) {
        setUrls((current) =>
          multiple ? [...current, ...uploaded].slice(0, limit) : uploaded.slice(0, 1)
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

      {urls.map((url, index) => (
        <input key={`${url}-${index}`} type="hidden" name={name} value={url} />
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

      {urls.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {urls.map((url, index) => (
            <li key={`${url}-preview`} className="relative">
              <Image
                src={url}
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
