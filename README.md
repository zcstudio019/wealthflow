# WealthFlow

WealthFlow 是面向中小微企业老板的财富管理系统。项目采用 React/Vite 前端和 Node.js/TypeScript 后端，正式数据库架构为 Drizzle ORM + MySQL 8.0。

## 项目结构

- `frontend/`：React、TypeScript、Vite
- `backend/`：Node.js、TypeScript、Drizzle ORM、mysql2
- `backend/db/`：MySQL schema
- `backend/drizzle/mysql/`：MySQL 版本化 migration
- `backend/drizzle/sqlite-legacy/`：旧 SQLite migration，仅供对照
- `docs/legacy/`：原 SQLite、D1、Cloudflare/Vinext 实现
- `deploy/nginx/`：生产反向代理预留目录，本阶段不配置

## 环境要求

- Node.js 22.19 或更高版本
- npm 11 或兼容 npm workspaces 的版本
- MySQL 8.0，字符集 utf8mb4

## 安装

```bash
npm install
```

## 数据库配置

复制 `backend/.env.example` 为 `backend/.env`，填写 MySQL 配置。优先读取 `DATABASE_URL`；未配置时读取分项 `DB_*` 变量。项目没有 SQLite、内存数据库或 localhost 数据库 fallback。

## Migration

```bash
npm run db:generate
npm run db:migrate
npm run db:check
```

生产部署顺序为：配置环境变量，执行 `npm run db:migrate`，迁移成功后执行 `npm run start:backend`。后端启动不会自动执行 migration，也不会 drop、truncate 或 reset schema。

## 开发启动

数据库配置和 migration 完成后：

```bash
npm run dev
```

也可以分别启动：

```bash
npm run dev:frontend
npm run dev:backend
```

- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/api/health

健康检查正常时返回 `{"status":"ok","database":"ok"}`；数据库不可达时返回 HTTP 503，且不暴露连接信息。

## Build 与测试

```bash
npm run build
npm run test:precision
npm run test:mysql:static
```

连接空白、可丢弃的 MySQL 8 测试库并执行 migration 后，才可运行写入集成测试：

```bash
MYSQL_TEST_ALLOW_WRITE=1 npm run test:mysql
```

该脚本拒绝在 `NODE_ENV=production` 下运行，并只清理自身随机测试用户的数据。

## 生产安全边界

后端默认只监听回环地址。生产反向代理必须删除客户端传入的 `oai-authenticated-user-*` 头，并仅写入由可信认证层验证后的身份头；不要将 8000 端口直接暴露到 Internet。数据库账号使用最小权限，secret 仅保存在服务器环境变量或 secret manager 中。