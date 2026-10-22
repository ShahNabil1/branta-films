/** What a viewer pays for a series: the discounted price when a valid one is set, otherwise the regular price. */
export function seriesPrice(price: number, discount: number | null | undefined) {
  const onSale = discount != null && discount >= 0 && discount < price;
  const final = onSale ? discount : price;
  return { final, original: onSale ? price : null, percentOff: onSale && price > 0 ? Math.round((1 - discount / price) * 100) : 0, isFree: final <= 0 && price <= 0 };
}
