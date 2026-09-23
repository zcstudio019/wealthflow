import { and, desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { financialSnapshots } from "../../../db/schema";

const keys = ["revenue","cost","expenses","companyCash","personalCash","familyAssets","investments","receivable","overdue","inventory","fixedAssets","companyDebt","personalDebt","incoming30","outgoing30","monthlyFixed"] as const;

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  try {
    const rows = await getDb().select().from(financialSnapshots).where(eq(financialSnapshots.userId, user.userId)).orderBy(desc(financialSnapshots.month)).limit(36);
    return Response.json({ snapshots: rows.map(r => ({ ...r, data: JSON.parse(r.data) })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  try {
    const body = await request.json() as { month?: string; data?: Record<string, unknown> };
    if (!body.month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(body.month)) return Response.json({ error: "月份格式不正确" }, { status: 400 });
    if (!body.data || typeof body.data !== "object") return Response.json({ error: "缺少财务数据" }, { status: 400 });
    const clean: Record<string, number> = {};
    for (const key of keys) {
      const value = Number(body.data[key] ?? 0);
      if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000) return Response.json({ error: `${key} 数值不正确` }, { status: 400 });
      clean[key] = Math.round(value * 100) / 100;
    }
    const now = new Date().toISOString();
    const values = { id: crypto.randomUUID(), userId: user.userId, month: body.month, data: JSON.stringify(clean), updatedAt: now };
    await getDb().insert(financialSnapshots).values(values).onConflictDoUpdate({ target: [financialSnapshots.userId, financialSnapshots.month], set: { data: values.data, updatedAt: now } });
    const [saved] = await getDb().select().from(financialSnapshots).where(and(eq(financialSnapshots.userId, user.userId), eq(financialSnapshots.month, body.month))).limit(1);
    return Response.json({ snapshot: { ...saved, data: JSON.parse(saved.data) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 500 });
  }
}
