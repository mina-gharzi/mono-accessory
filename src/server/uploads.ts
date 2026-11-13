import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2000;
const WEBP_QUALITY = 85;
const UPLOAD_URL_PREFIX = "/uploads/";
const UPLOADS_DIRECTORY = path.join(process.cwd(), "public", "uploads");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const EMPTY_FILE = "تصویری انتخاب نشده است.";
const FILE_TOO_LARGE = "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.";
const INVALID_IMAGE_TYPE = "فقط تصویر JPEG، PNG یا WebP مجاز است.";
const IMAGE_PROCESS_FAILED = "پردازش تصویر ناموفق بود.";
const IMAGE_SAVE_FAILED = "ذخیرهٔ تصویر ناموفق بود.";

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export interface ImageStorage {
  save(buffer: Buffer, filename: string): Promise<string>;
  remove(url: string): Promise<void>;
}

function toMonthlyFolder(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

class LocalImageStorage implements ImageStorage {
  async save(buffer: Buffer, filename: string): Promise<string> {
    const safeName = path.basename(filename);

    if (safeName !== filename || !safeName) {
      throw new Error("Invalid upload filename.");
    }

    const folder = toMonthlyFolder(new Date());
    const directory = path.join(UPLOADS_DIRECTORY, folder);

    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, safeName), buffer);

    return `${UPLOAD_URL_PREFIX}${folder}/${safeName}`;
  }

  async remove(url: string): Promise<void> {
    if (!url.startsWith(UPLOAD_URL_PREFIX)) {
      return;
    }

    const relative = url.slice(UPLOAD_URL_PREFIX.length);
    const target = path.resolve(UPLOADS_DIRECTORY, relative);
    const rootWithSeparator = `${UPLOADS_DIRECTORY}${path.sep}`;

    if (target !== UPLOADS_DIRECTORY && !target.startsWith(rootWithSeparator)) {
      return;
    }

    try {
      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}

function createImageStorage(): ImageStorage {
  const driver = process.env.IMAGE_STORAGE?.trim() || "local";

  if (driver === "local") {
    return new LocalImageStorage();
  }

  throw new Error(`Unsupported IMAGE_STORAGE value: ${driver}`);
}

// The only place that picks a storage driver. Add Cloudinary/S3 by
// implementing ImageStorage and returning it here.
const imageStorage = createImageStorage();

function detectImageFormat(buffer: Buffer): "jpeg" | "png" | "webp" | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpeg";
  }

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return "png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export async function saveUploadedImage(
  file: File
): Promise<UploadImageResult> {
  if (file.size === 0) {
    return { ok: false, message: EMPTY_FILE };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: FILE_TOO_LARGE };
  }

  const input = Buffer.from(await file.arrayBuffer());

  if (!detectImageFormat(input)) {
    return { ok: false, message: INVALID_IMAGE_TYPE };
  }

  let processed: Buffer;

  try {
    processed = await sharp(input)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return { ok: false, message: IMAGE_PROCESS_FAILED };
  }

  try {
    const url = await imageStorage.save(processed, `${randomUUID()}.webp`);

    return { ok: true, url };
  } catch {
    return { ok: false, message: IMAGE_SAVE_FAILED };
  }
}

export async function removeStoredImage(url: string): Promise<void> {
  await imageStorage.remove(url);
}
