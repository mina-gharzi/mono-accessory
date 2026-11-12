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
