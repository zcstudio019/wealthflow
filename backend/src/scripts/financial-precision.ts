import { normalizeFinancialData, toApiFinancialData } from "../domain/financial-data.js";

const cases = [0.01, 0.10, 1_000_000.01, 999_999_999.99] as const;
for (const amount of cases) {
  const stored = normalizeFinancialData({ revenue: amount });
  if (!/^\d+\.\d{2}$/.test(stored.revenue)) throw new Error(`Not stored at scale 2: ${amount}`);
  const restored = toApiFinancialData(stored).revenue;
  if (restored !== amount) throw new Error(`Precision mismatch: ${amount} -> ${stored.revenue} -> ${restored}`);
}

const sum = normalizeFinancialData({ revenue: 0.1 + 0.2 });
if (sum.revenue !== "0.30") throw new Error(`Expected 0.30, received ${sum.revenue}`);

console.log(JSON.stringify({
  financialPrecision: "ok",
  stored: ["0.01", "0.10", "1000000.01", "999999999.99", "0.30"],
}));