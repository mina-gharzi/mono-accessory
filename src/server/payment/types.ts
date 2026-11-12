export type PaymentOrder = {
  orderNumber: string;
  amount: number;
};

export type PaymentInitiation = {
  redirectPath: string;
  reference: string;
};

export type PaymentVerification =
  | { ok: true; reference: string }
  | { ok: false; message: string };

/**
 * A real Iranian gateway only needs to implement this interface and be
 * registered in `getPaymentProvider`; no page or action code has to change.
 */
export interface PaymentProvider {
  readonly id: string;
  createPayment(order: PaymentOrder): Promise<PaymentInitiation>;
  verifyPayment(
    order: PaymentOrder,
    reference: string
  ): Promise<PaymentVerification>;
}
