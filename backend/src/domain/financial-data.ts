import type { StoredFinancialData } from "../../db/schema.js";

export const financialKeys = ["revenue","cost","expenses","companyCash","personalCash","familyAssets","investments","receivable","overdue","inventory","fixedAssets","companyDebt","personalDebt","incoming30","outgoing30","monthlyFixed"] as const;

export function normalizeFinancialData(source: Record<string, unknown>) {
  const stored: StoredFinancialData = {};
  for (const key of financialKeys) {
    const value = Number(source[key] ?? 0);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000) {
      throw new RangeError(`${key} 数值不正确`);
    }
    const cents = Math.round((value + Number.EPSILON) * 100);
    stored[key] = (cents / 100).toFixed(2);
  }
  return stored;
}

export function toApiFinancialData(data: StoredFinancialData) {
  return Object.fromEntries(financialKeys.map((key) => [key, Number(data[key] ?? "0.00")]));
}