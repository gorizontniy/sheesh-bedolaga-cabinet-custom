/** Длина «месяца» в днях — тот же множитель, что использует бэкенд при расчёте цены за месяц. */
const DAYS_IN_MONTH = 30;

/**
 * Цена за месяц (в копейках) для периода длиной `days` дней.
 *
 * Возвращает `null`, когда месячная ставка не имеет смысла: для периода
 * в месяц и короче она либо повторяет цену периода (30 дней), либо
 * выдаёт цену периода за месячную (7 дней → цена семи дней «за месяц»).
 */
export function getMonthlyPriceKopeks(priceKopeks: number, days: number): number | null {
  if (!Number.isFinite(priceKopeks) || !Number.isFinite(days)) return null;
  if (days <= DAYS_IN_MONTH) return null;
  return Math.round((priceKopeks * DAYS_IN_MONTH) / days);
}

/**
 * Экономия в копейках относительно помесячной оплаты того же срока.
 *
 * Проценты информируют, рубли убеждают: карточка на 360 дней показывает
 * не только «−32 %», но и «вы экономите 1 150 ₽» против двенадцати месячных
 * платежей. Возвращает `null`, когда сравнивать не с чем (нет месячного
 * тарифа), период не длиннее месяца, или экономии не возникает.
 */
export function getSavingsVsMonthlyKopeks(
  priceKopeks: number,
  days: number,
  monthlyPriceKopeks: number | null | undefined,
): number | null {
  if (!Number.isFinite(priceKopeks) || !Number.isFinite(days)) return null;
  if (!monthlyPriceKopeks || !Number.isFinite(monthlyPriceKopeks)) return null;
  if (days <= DAYS_IN_MONTH) return null;
  const baseline = (monthlyPriceKopeks * days) / DAYS_IN_MONTH;
  const savings = Math.round(baseline - priceKopeks);
  return savings > 0 ? savings : null;
}

/**
 * Доля экономии относительно помесячной оплаты, в целых процентах.
 *
 * Зачем отдельно от процента на бейдже: бейдж показывает скидку промогруппы,
 * а это — выгода за СРОК, и величины разные. На годе бейдж может писать 6%,
 * тогда как против помесячной оплаты человек экономит 19%. Меньшая из двух
 * цифр набрана крупно, поэтому вторую надо назвать вслух.
 */
export function getSavingsPercent(priceKopeks: number, savingsKopeks: number | null): number | null {
  if (savingsKopeks === null || !Number.isFinite(priceKopeks)) return null;
  const baseline = priceKopeks + savingsKopeks;
  if (baseline <= 0) return null;
  const pct = Math.round((savingsKopeks / baseline) * 100);
  return pct > 0 ? pct : null;
}
