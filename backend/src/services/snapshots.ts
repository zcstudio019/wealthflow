import type { StoredFinancialData } from "../../db/schema.js";
import { normalizeFinancialData, toApiFinancialData } from "../domain/financial-data.js";
import { listSnapshots, saveSnapshot } from "../repositories/snapshots.js";

export class ValidationError extends Error {}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toApiSnapshot(row: {
  id: string;
  userId: string;
  month: string;
  data: StoredFinancialData;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    data: toApiFinancialData(row.data),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export async function getSnapshots(userId: string) {
  const rows = await listSnapshots(userId);
  return rows.map(toApiSnapshot);
}

export async function upsertSnapshot(userId: string, body: unknown) {
  if (!body || typeof body !== "object") throw new ValidationError("缺少请求数据");
  const input = body as { month?: unknown; data?: unknown };
  if (typeof input.month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)) {
    throw new ValidationError("月份格式不正确");
  }
  if (!input.data || typeof input.data !== "object") throw new ValidationError("缺少财务数据");

  let stored: StoredFinancialData;
  try {
    stored = normalizeFinancialData(input.data as Record<string, unknown>);
  } catch (error) {
    if (error instanceof RangeError) throw new ValidationError(error.message);
    throw error;
  }

  const saved = await saveSnapshot(userId, input.month, stored);
  if (!saved) throw new Error("保存后未找到记录");
  return toApiSnapshot(saved);
}