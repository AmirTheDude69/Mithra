export function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}
