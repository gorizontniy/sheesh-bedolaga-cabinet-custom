import { describe, expect, it } from 'vitest';
import { getMonthlyPriceKopeks, getSavingsPercent, getSavingsVsMonthlyKopeks } from './pricing';

describe('getMonthlyPriceKopeks', () => {
  it('hides the monthly rate for periods of a month or shorter', () => {
    expect(getMonthlyPriceKopeks(4830, 7)).toBeNull();
    expect(getMonthlyPriceKopeks(9900, 14)).toBeNull();
    expect(getMonthlyPriceKopeks(16030, 30)).toBeNull();
  });

  it('divides by whole months for multiples of 30 days', () => {
    expect(getMonthlyPriceKopeks(30000, 90)).toBe(10000);
    expect(getMonthlyPriceKopeks(60000, 180)).toBe(10000);
  });

  it('prorates periods that are not whole months', () => {
    expect(getMonthlyPriceKopeks(15000, 45)).toBe(10000);
    expect(getMonthlyPriceKopeks(100000, 365)).toBe(8219);
  });

  it('returns null for non-finite input', () => {
    expect(getMonthlyPriceKopeks(Number.NaN, 90)).toBeNull();
    expect(getMonthlyPriceKopeks(30000, Number.NaN)).toBeNull();
    expect(getMonthlyPriceKopeks(30000, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('getSavingsVsMonthlyKopeks', () => {
  // Живые цены тарифа «Стандартный» на 2026-09-08.
  it('считает экономию против помесячной оплаты', () => {
    expect(getSavingsVsMonthlyKopeks(75000, 90, 30000)).toBe(15000);
    expect(getSavingsVsMonthlyKopeks(144000, 180, 30000)).toBe(36000);
    expect(getSavingsVsMonthlyKopeks(245000, 360, 30000)).toBe(115000);
  });

  it('молчит там, где сравнивать не с чем или экономии нет', () => {
    expect(getSavingsVsMonthlyKopeks(30000, 30, 30000)).toBeNull();
    expect(getSavingsVsMonthlyKopeks(15000, 7, 30000)).toBeNull();
    expect(getSavingsVsMonthlyKopeks(75000, 90, null)).toBeNull();
    expect(getSavingsVsMonthlyKopeks(90000, 90, 30000)).toBeNull();
    expect(getSavingsVsMonthlyKopeks(Number.NaN, 90, 30000)).toBeNull();
  });
});

describe('getSavingsPercent', () => {
  // Живые цены «Стандартного» и Premium: бейдж пишет 6%, а выгода за срок — 19%.
  it('считает долю экономии от помесячной базы', () => {
    expect(getSavingsPercent(564150, 132150)).toBe(19);
    expect(getSavingsPercent(245000, 115000)).toBe(32);
    expect(getSavingsPercent(75000, 15000)).toBe(17);
  });

  it('молчит там, где экономии нет', () => {
    expect(getSavingsPercent(30000, null)).toBeNull();
    expect(getSavingsPercent(30000, 0)).toBeNull();
    expect(getSavingsPercent(Number.NaN, 100)).toBeNull();
  });
});
