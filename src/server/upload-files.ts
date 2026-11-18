import path from "node:path";

export const UPLOAD_URL_PREFIX = "/uploads/";

const DEFAULT_UPLOAD_DIRECTORY = "uploads";
const LEGACY_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads"
);

const CONTENT_TYPES: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export type StoredUpload = {
  filePath: string;
  contentType: string;
};

/**
 * Absolute directory that receives new uploads. A relative UPLOAD_DIR is
 * resolved against the working directory; production should set an absolute
 * path on persistent storage.
 */
export function getUploadDirectory(): string {
  const configured = process.env.UPLOAD_DIR?.trim();

  // UPLOAD_DIR is runtime configuration on persistent storage, not build input.
  return path.resolve(
    /*turbopackIgnore: true*/ configured || DEFAULT_UPLOAD_DIRECTORY
  );
}

function isSafeSegment(segment: string): boolean {
  return (
    segment.length > 0 &&
    segment !== "." &&
    segment !== ".." &&
    !segment.includes("/") &&
    !segment.includes("\\") &&
    !segment.includes(":") &&
    !segment.includes("\0")
  );
}

function resolveInside(
  root: string,
  segments: readonly string[]
): StoredUpload | null {
  if (segments.length === 0 || !segments.every(isSafeSegment)) {
    return null;
  }

  const fileName = segments[segments.length - 1];
  const contentType = CONTENT_TYPES[path.extname(fileName).toLowerCase()];

  if (!contentType) {
    return null;
  }

  const resolvedRoot = path.resolve(root);
  const filePath = path.resolve(resolvedRoot, ...segments);
  const relative = path.relative(resolvedRoot, filePath);

  // Reject anything that resolves outside the root, including drive changes
  // and symlink-free traversal attempts such as "..".
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return { filePath, contentType };
}

export function resolveStoredUpload(
  segments: readonly string[]
): StoredUpload | null {
  return resolveInside(getUploadDirectory(), segments);
}

/**
 * Development uploads created before UPLOAD_DIR existed live under
 * public/uploads. They stay readable, but new files never go there.
 */
export function resolveLegacyStoredUpload(
  segments: readonly string[]
): StoredUpload | null {
  return resolveInside(LEGACY_UPLOAD_DIRECTORY, segments);
}
