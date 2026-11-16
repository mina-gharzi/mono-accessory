import { expect, test } from "@playwright/test";
import { registerCustomer } from "./helpers";

test("access control redirects anonymous users and blocks customers from admin", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  await expect(
    page.getByRole("heading", { name: "ورود به حساب" })
  ).toBeVisible();

  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Forders/);

  await registerCustomer(page);

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "این صفحه پیدا نشد" })
  ).toBeVisible();
});
