export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <p className="sr-only" role="status">
        در حال بارگذاری پنل مدیریت
      </p>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <div className="h-4 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-8 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div
        className="h-64 animate-pulse rounded-lg border border-border bg-muted/60 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
