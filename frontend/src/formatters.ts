export function formatWanAmount(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  const absoluteWan = Math.abs(amount) / 10_000;
  const formatted = Math.abs(amount) >= 1_000_000
    ? absoluteWan.toFixed(1).replace(/\.0$/, "")
    : absoluteWan.toFixed(1);

  return `${amount < 0 ? "−" : ""}¥${formatted}万`;
}
