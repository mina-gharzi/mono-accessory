import { expect, test } from "@playwright/test";
import { login } from "./helpers";

// A valid 1x1 PNG. The server validates magic bytes and re-encodes it with
// sharp, so the bytes must be a real image rather than an arbitrary buffer.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

test("admin uploads an image through the product form and it renders on the storefront", async ({
  page,
}) => {
  const adminMobile = process.env.ADMIN_MOBILE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminMobile || !adminPassword) {
    throw new Error("ADMIN_MOBILE and ADMIN_PASSWORD must be set for E2E.");
  }

  await login(page, adminMobile, adminPassword);

  const slug = `e2e-upload-${Date.now()}`;

  await page.goto("/admin/products/new");
  await page.getByLabel("نام محصول").fill("محصول آزمایشی بارگذاری تصویر");
  await page.getByLabel("اسلاگ").fill(slug);
  await page
    .getByLabel("توضیحات")
    .fill("محصولی برای آزمون بارگذاری تصویر از پنل مدیریت.");
  await page.getByLabel("دسته‌بندی").selectOption({ index: 1 });
  await page.getByLabel("قیمت (تومان)").fill("120000");
  await page.getByLabel("رنگ").fill("طلایی");

  // The uploader clears the input value after copying the FileList. If it
  // cleared it first, this selection would be lost and no preview would appear.
  await page.locator('input[type="file"]').setInputFiles({
    name: "tiny.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });

  const preview = page.getByAltText("پیش‌نمایش تصویر 1");
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute("src", /^\/uploads\//);
  await expect(
    page.locator('input[type="hidden"][name="images"]')
  ).toHaveValue(/^\/uploads\//);

  await page.getByRole("button", { name: "ایجاد محصول" }).click();
  await page.waitForURL(/\/admin\/products\/[^/]+\/edit\?status=created/);

  await page.goto(`/product/${slug}`);

  const galleryImage = page
    .getByRole("button", { name: /بزرگ‌نمایی تصویر/ })
    .locator("img");
  await expect(galleryImage).toBeVisible();
  await expect
    .poll(() =>
      galleryImage.evaluate((image: HTMLImageElement) => image.naturalWidth)
    )
    .toBeGreaterThan(0);
});
