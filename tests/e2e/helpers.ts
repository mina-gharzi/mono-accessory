import { expect, type Page } from "@playwright/test";

export const BASE_URL =
  process.env.E2E_BASE_URL ?? "http://localhost:3000";

export function uniqueMobile(): string {
  const suffix = `${Date.now()}`.slice(-7);
  const random = `${Math.floor(Math.random() * 100)}`.padStart(2, "0");

  return `09${suffix}${random}`;
}

export async function registerCustomer(
  page: Page
): Promise<{ mobile: string; password: string }> {
  const mobile = uniqueMobile();
  const password = "Test1234";

  await page.goto("/register");
  await page.getByLabel("نام و نام خانوادگی").fill("مشتری آزمایشی");
  await page.getByLabel("شماره موبایل").fill(mobile);
  await page.getByLabel("رمز عبور", { exact: true }).fill(password);
  await page.getByLabel("تکرار رمز عبور").fill(password);
  await page.getByRole("button", { name: "ایجاد حساب" }).click();

  await page.waitForURL(/\/account/);

  return { mobile, password };
}

export async function login(
  page: Page,
  mobile: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("شماره موبایل").fill(mobile);
  await page.getByLabel("رمز عبور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "ورود", exact: true }).click();

  await page.waitForURL(/\/account/);
}

export async function addProductToCart(
  page: Page,
  productPath: string
): Promise<void> {
  await page.goto(productPath);

  // The product page renders the same actions twice (desktop and mobile);
  // the desktop copy comes first in the DOM.
  await page
    .getByRole("button", { name: /افزودن .* به سبد خرید/ })
    .first()
    .click();

  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("link", { name: "مشاهده سبد خرید" }).click();

  await page.waitForURL(/\/cart/);
}

export async function checkoutAndPay(
  page: Page,
  mobile: string
): Promise<string> {
  await page.goto("/checkout");

  await page.getByLabel("نام گیرنده").fill("مشتری آزمایشی");
  await page.getByLabel("شماره موبایل").fill(mobile);
  await page.getByLabel("استان").click();
  await page.getByRole("option", { name: "تهران" }).click();
  await page.getByLabel("شهر", { exact: true }).fill("تهران");
  await page.getByLabel("نشانی").fill("خیابان آزمایشی، پلاک ۱۲، واحد ۳");
  await page.getByLabel("کد پستی").fill("1234567890");

  await page.getByRole("button", { name: "ثبت سفارش و پرداخت" }).click();
  await page.waitForURL(/\/payment\/mock\//);

  await page.getByRole("button", { name: "پرداخت موفق (آزمایشی)" }).click();
  await page.waitForURL(/\/account\/orders\/MN-/);

  const match = page.url().match(/MN-\d{6}-\d{5}/);

  if (!match) {
    throw new Error("Order number was not present in the order URL.");
  }

  return match[0];
}
