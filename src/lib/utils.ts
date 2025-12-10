import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const BUSINESS_TIMEZONE = "Asia/Kolkata";

/** Merges conditional class names and resolves Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** "60 min", "90 min", "2 hr" or "2 hr 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

/** Formats an instant for display in the branch timezone (defaults to Asia/Kolkata). */
export function formatDateTime(value: Date | string, timeZone: string = BUSINESS_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}
