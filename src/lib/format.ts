const priceFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatPrice(value: number): string {
  return `${priceFormatter.format(value)} تومان`;
}

export function formatDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);

  return dateFormatter.format(date);
}
