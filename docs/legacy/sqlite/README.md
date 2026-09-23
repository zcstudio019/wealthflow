# SQLite / Cloudflare D1 遗留说明

本目录保留 MySQL 迁移前的 Node SQLite + Drizzle sqlite-proxy 实现、SQLite schema 与初始 migration，仅用于审计、回滚参考和后续 D1 数据迁移工具开发。

正式运行入口 `backend/src/config/database.ts` 不再引用这些文件，也不再提供 SQLite fallback。旧 Cloudflare D1 本地状态在迁移前再次扫描，`financial_snapshots` 记录数为 0，因此本阶段无需执行业务数据导出或导入。

不要把本目录下的 SQLite migration 用于 MySQL。