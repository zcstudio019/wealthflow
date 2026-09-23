# 原 Cloudflare / Vinext 架构

重构前项目通过 Vinext 将 Next App Router/RSC 构建为 Cloudflare Worker，`cloudflare:workers` 提供 `DB` D1 binding，平台通过 `oai-authenticated-user-*` 请求头注入登录身份。

完成新结构构建与运行验证后，旧源码与配置已整体移动到 `docs/legacy/vinext/`，包括 `app/`、`db/`、`drizzle/`、原 Vite/Next/Cloudflare 配置和脚本。Wrangler 本地状态仍保留在被 Git 忽略的根目录 `.wrangler/`，它们均不属于新 npm workspace 的运行路径。

新 Node 后端继续识别相同认证请求头；非生产模式可使用 `DEV_USER_*` 本地身份。D1 与 SQLite schema 相同，但 D1 远端数据迁移到阿里云 RDS 不属于本阶段。