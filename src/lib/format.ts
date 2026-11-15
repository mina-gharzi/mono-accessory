const priceFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("fa-IR");

const ratingFormatter = new Intl.NumberFormat("fa-IR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  month: "short",
  day: "numeric",
});

const percentFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
});

export function formatPrice(value: number): string {
  return `${priceFormatter.format(value)} تومان`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatRating(value: number): string {
  return ratingFormatter.format(value);
}

export function formatDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);

  return dateFormatter.format(date);
}

export function formatDateShort(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);

  return shortDateFormatter.format(date);
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(Math.abs(value))}٪`;
}
