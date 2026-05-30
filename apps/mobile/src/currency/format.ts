// Currency / price formatting for the SaaS billing surfaces (subscription
// plans, seat pricing, usage). Amounts are handled in minor units (cents) to
// avoid floating-point drift, matching how the billing service stores them.

export type Money = {amountMinor: number; currency: string};

export function formatCurrency(
  amountMinor: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

export function formatMoney(money: Money, locale = 'en-US'): string {
  return formatCurrency(money.amountMinor, money.currency, locale);
}
