import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import {
  resolveLegacyStoredUpload,
  resolveStoredUpload,
  type StoredUpload,
} from "@/server/upload-files";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

function notFound(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

function matchesEtag(header: string | null, etag: string): boolean {
  if (!header) return false;

  return header.split(",").some((value) => {
    const candidate = value.trim();

    return candidate === "*" || candidate === etag || candidate === `W/${etag}`;
  });
}

function isNotModified(
  request: Request,
  etag: string,
  lastModified: Date
): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");

  if (ifNoneMatch) {
    return matchesEtag(ifNoneMatch, etag);
  }

  const ifModifiedSince = request.headers.get("if-modified-since");

  if (!ifModifiedSince) return false;

  const since = Date.parse(ifModifiedSince);

  if (Number.isNaN(since)) return false;

  return Math.floor(lastModified.getTime() / 1000) <= Math.floor(since / 1000);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: segments } = await params;
  const upload: StoredUpload | null =
    resolveStoredUpload(segments) ?? resolveLegacyStoredUpload(segments);

  if (!upload) {
    return notFound();
  }

  let fileStat;

  try {
    fileStat = await stat(/*turbopackIgnore: true*/ upload.filePath);
  } catch {
    return notFound();
  }

  if (!fileStat.isFile()) {
    return notFound();
  }

  const lastModified = new Date(fileStat.mtimeMs);
  const etag = `"${fileStat.size.toString(16)}-${Math.floor(
    fileStat.mtimeMs
  ).toString(16)}"`;
  const headers = new Headers({
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": upload.contentType,
    "Last-Modified": lastModified.toUTCString(),
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  });

  if (isNotModified(request, etag, lastModified)) {
    return new Response(null, { status: 304, headers });
  }

  headers.set("Content-Length", String(fileStat.size));

  const body = Readable.toWeb(
    createReadStream(/*turbopackIgnore: true*/ upload.filePath)
  ) as ReadableStream<Uint8Array>;

  return new Response(body, { status: 200, headers });
}
