import { expect, test } from "@playwright/test";
import {
  addProductToCart,
  BASE_URL,
  checkoutAndPay,
  login,
  registerCustomer,
} from "./helpers";

test("admin moves a paid order to processing and only sees allowed next steps", async ({
  page,
  browser,
}) => {
  const { mobile } = await registerCustomer(page);
  await addProductToCart(page, "/product/necklace-steel-gold");
  const orderNumber = await checkoutAndPay(page, mobile);

  const adminMobile = process.env.ADMIN_MOBILE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminMobile || !adminPassword) {
    throw new Error("ADMIN_MOBILE and ADMIN_PASSWORD must be set for E2E.");
  }

  const adminContext = await browser.newContext({ baseURL: BASE_URL });
  const adminPage = await adminContext.newPage();

  try {
    await login(adminPage, adminMobile, adminPassword);
    await adminPage.goto(`/admin/orders/${orderNumber}`);

    await expect(
      adminPage.getByText("پرداخت شده", { exact: true }).first()
    ).toBeVisible();

    const nextStepButtons = adminPage.getByRole("button", {
      name: /^تغییر به /,
    });

    await expect(nextStepButtons).toHaveCount(1);
    await expect(
      adminPage.getByRole("button", { name: "تغییر به در حال پردازش" })
    ).toBeVisible();
    await expect(
      adminPage.getByRole("button", { name: "تغییر به ارسال شده" })
    ).toHaveCount(0);
    await expect(
      adminPage.getByRole("button", { name: "لغو سفارش" })
    ).toBeVisible();

    await Promise.all([
      adminPage.waitForResponse(
        (response) => response.request().method() === "POST"
      ),
      adminPage
        .getByRole("button", { name: "تغییر به در حال پردازش" })
        .click(),
    ]);

    await adminPage.reload();

    await expect(
      adminPage.getByText("در حال پردازش", { exact: true }).first()
    ).toBeVisible();
    await expect(
      adminPage.getByRole("button", { name: "تغییر به ارسال شده" })
    ).toBeVisible();
    await expect(
      adminPage.getByRole("button", { name: "تغییر به در حال پردازش" })
    ).toHaveCount(0);
    await expect(
      adminPage.getByRole("button", { name: /^تغییر به / })
    ).toHaveCount(1);
  } finally {
    await adminContext.close();
  }
});
