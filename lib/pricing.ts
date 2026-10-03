// Money is summed in halalas (1 riyal = 100 halalas) as integers, so totals
// never pick up floating-point drift (0.1 + 0.2 !== 0.3). Prices are stored
// as Decimal(10, 2), so every price is a whole number of halalas.

export function toHalalas(amount: number | string | { toString(): string }): number {
  return Math.round(Number(amount.toString()) * 100);
}

export function fromHalalas(halalas: number): number {
  return halalas / 100;
}

export interface PricedLine {
  price: number | string | { toString(): string };
  durationMinutes: number;
  quantity: number;
}

// Total price and time for a set of lines. Quantity is the number of people
// receiving that option: the beautician does them back to back, so both the
// price and the time scale with it.
export function totalsForLines(lines: PricedLine[]): { totalHalalas: number; totalMinutes: number } {
  let totalHalalas = 0;
  let totalMinutes = 0;
  for (const line of lines) {
    totalHalalas += toHalalas(line.price) * line.quantity;
    totalMinutes += line.durationMinutes * line.quantity;
  }
  return { totalHalalas, totalMinutes };
}
