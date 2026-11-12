import type {
  PaymentInitiation,
  PaymentOrder,
  PaymentProvider,
  PaymentVerification,
} from "./types";

const REFERENCE_PREFIX = "mock_";

function buildReference(orderNumber: string): string {
  return `${REFERENCE_PREFIX}${orderNumber}`;
}

export const mockPaymentProvider: PaymentProvider = {
  id: "mock",

  async createPayment(order: PaymentOrder): Promise<PaymentInitiation> {
    const reference = buildReference(order.orderNumber);
    const redirectPath = `/payment/mock/${encodeURIComponent(
      order.orderNumber
    )}?ref=${encodeURIComponent(reference)}`;

    return { redirectPath, reference };
  },

  async verifyPayment(
    order: PaymentOrder,
    reference: string
  ): Promise<PaymentVerification> {
    if (reference !== buildReference(order.orderNumber)) {
      return { ok: false, message: "تراکنش پرداخت معتبر نیست." };
    }

    return { ok: true, reference };
  },
};
