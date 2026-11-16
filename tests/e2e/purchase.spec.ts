import { expect, test } from "@playwright/test";
import {
  addProductToCart,
  checkoutAndPay,
  registerCustomer,
} from "./helpers";

test("customer can register, buy, pay and see the cart and stock updated", async ({
  page,
}) => {
  const { mobile } = await registerCustomer(page);

  // The gold variant of this product starts with two units in stock.
  await addProductToCart(
    page,
    "/product/eyeglasses-metal?variant=MG-303-GD"
  );

  const quantity = page.getByRole("group", { name: "تعداد" });
  await expect(quantity).toContainText("۱");

  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST"),
    page.getByRole("button", { name: "افزایش تعداد" }).click(),
  ]);

  await page.reload();
  await expect(page.getByRole("group", { name: "تعداد" })).toContainText("۲");

  const orderNumber = await checkoutAndPay(page, mobile);

  await expect(
    page.getByRole("heading", { name: new RegExp(orderNumber) })
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "پرداخت با موفقیت انجام شد"
  );
  await expect(
    page.getByText("پرداخت شده", { exact: true }).first()
  ).toBeVisible();

  await page.goto("/cart");
  await expect(
    page.getByText("سبد خرید شما خالی است", { exact: true })
  ).toBeVisible();

  await page.goto("/product/eyeglasses-metal?variant=MG-303-GD");
  await expect(
    page.getByText("این گزینه فعلاً ناموجود است")
  ).toBeVisible();
});
