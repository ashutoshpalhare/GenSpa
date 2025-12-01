/**
 * Money helpers.
 *
 * PostgreSQL stores money as NUMERIC(12,2) and Drizzle returns it as a string.
 * All arithmetic is performed on integer minor units (paise) so no binary
 * floating-point rounding ever touches a monetary value.
 */

const DECIMAL_PATTERN = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

export function toMinorUnits(amount: string | number): number {
  const text = typeof amount === "number" ? amount.toFixed(2) : amount.trim();
  const match = DECIMAL_PATTERN.exec(text);
  if (!match) {
    throw new Error(`Invalid money amount: ${String(amount)}`);
  }
  const [, sign, whole, fraction = ""] = match;
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return sign ? -minor : minor;
}

export function fromMinorUnits(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(minor));
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

export function addMoney(...amounts: Array<string | number>): string {
  return fromMinorUnits(amounts.reduce<number>((sum, amount) => sum + toMinorUnits(amount), 0));
}

/** Percentage of an amount, rounded half-up to the nearest paisa. */
export function percentageOf(amount: string | number, percent: number): string {
  const minor = toMinorUnits(amount);
  return fromMinorUnits(Math.round((minor * percent) / 100));
}

/** Display helper, e.g. "3500" -> "₹3,500" and "2999.5" -> "₹2,999.50". */
export function formatINR(amount: string | number): string {
  const minor = toMinorUnits(amount);
  const hasPaise = Math.abs(minor) % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}
