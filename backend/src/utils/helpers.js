/**
 * Shared billing utility functions.
 * Used by both scheduler.js and payment.controller.js.
 */

/** Add exactly one calendar month to a Date */
export function addOneMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/** Format a Date to "YYYY-MM" billing month string */
export function billingMonthStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Escape special regex characters in a user-provided string */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
