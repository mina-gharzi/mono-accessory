import { mockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./types";

export type {
  PaymentInitiation,
  PaymentOrder,
  PaymentProvider,
  PaymentVerification,
} from "./types";

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  switch (provider) {
    case undefined:
    case "":
    case "mock":
      return mockPaymentProvider;
    default:
      throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
  }
}
