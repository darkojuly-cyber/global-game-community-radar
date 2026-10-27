# EvoMeme Trend Radar

Discover What's Trending. Make It Playable.

EvoMeme 海外运营与小游戏策划的情报工作台。Next.js App Router + TypeScript + Tailwind CSS + Prisma + PostgreSQL。默认中文，不内置虚构热点或演示种子数据。

## Windows 本地运行（推荐）

不需要 Railway 或服务器。先安装 [Node.js 24 LTS](https://nodejs.org/)，完整解压本地包，然后双击 **start-windows.bat**。第一次自动安装依赖、初始化数据库并构建，随后自动打开浏览器中的「每日选题」。保留命令窗口；关闭时按 Ctrl+C。数据存放在解压目录的 `.local/postgres`。

完整说明：[Windows 本地使用](docs/LOCAL-WINDOWS.md)。参考工具记录：[Meme & Game Repo](docs/REFERENCE-NOTES.md)。

## 开发环境启动

需要 Node.js 24+、npm。仓库提供用于本机开发的 PostgreSQL 二进制包，无需 Docker 或 root 权限。开发数据库只监听本机；`.local/postgres` 为持久数据目录，请勿删除。默认本机账号仅用于开发，生产请使用独立受管 PostgreSQL 和安全凭据。

```bash
npm ci --cache /workspace/.npm-cache
# 仅在不存在 .env 时复制，保留已有配置
cp -n .env.example .env
npm run db:generate
npm run db:local
```

保留数据库进程，在另一个终端运行：

```bash
npm run db:push
npm run dev
```

生产构建的本机验证：`npm run build` 后执行 `npm start`。健康检查：`GET /api/health` 应返回 `database: ok`。开发时使用当前 checkout，云任务已隔离，无需创建 Git worktree。不要同时运行 dev 与 production server，或者在运行 production server 时重建 `.next`。

已有 PostgreSQL 时，在 `.env` 配置 `DATABASE_URL`，跳过 `db:local`。`db:push` 用于开发数据库；正式部署需审阅 schema 变更并建立迁移与备份流程，不要使用数据重置或忽略数据丢失警告的命令。

## 工作流

1. 在「数据源与设置」新增 Google Trends RSS（如 `https://trends.google.com/trending/rss?geo=PH`、`geo=PK`）或批准域名的 RSS，点击「测试并同步」。来源保存同步日志、错误、最近成功时间，可以停用。
2. 无需密钥也可手动保存 URL，或导入授权 JSON / CSV。手动 URL 只保存输入文字和链接，不自动读取网页或视频。导入为事务，单批最多 500 条、3MB，格式错误整批拒绝。
3. 使用国家多选、时间、类型、来源、状态、关键词、机制和生活场景筛选。国家字段表示来源市场，不证明作者所在地或当地传播。未知语言保留 `unknown`。
4. 进入详情，核对来源、原始文字和指标快照；可编辑游戏、广告、短视频的结构化档案，记录机制、情绪与人工分析。没有可访问视频时不推测镜头。
5. 「Turn Into Game Idea」生成三类方向与 22 项设计字段、完整英文开发 Prompt、推广文案、Remix Challenge。无 AI 密钥时使用明确标记的规则模板。配置 AI 后使用模型生成并校验结构；服务失败会报错，不会偷偷降级为声称 AI 生成的内容。
6. 创意库支持收藏、评分、标签、编辑、七阶段状态、历史版本和人工发布效果记录。可导出 Markdown、JSON、CSV；CSV 的公式前缀会转义。
7. 「报告与复盘」提供全量资料、24h 日报与 7d 周报的 Markdown 导出。手动效果数据不是自动归因或因果证明。
8. 自定义监控匹配已采集的资料；不声称监听未连接的平台。生活场景扩展分类可在设置中编辑。

## 数据连接

| 连接方式                             | 状态及限制                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Google Trends RSS                    | 已实现，按来源市场与关键词去重；保留近似搜索量下界和关联新闻链接。下界不计算精确增长率。每个国家单独连接。                            |
| 公开 RSS / Atom                      | 已实现；批准域名见 `lib/ingest.ts`。拒绝重定向，避免服务器请求任意内网地址。                                                          |
| YouTube Data API                     | 已实现适配器，需 `YOUTUBE_API_KEY`；拉取地区游戏分类热门视频与公开计数。普通视频不自动当作 Shorts。当前环境无密钥，未做真实授权验证。 |
| 手动 URL / JSON / CSV                | 已实现；不下载第三方视频，不绕过访问限制。                                                                                            |
| TikTok、Meta、商业情报、游戏平台榜单 | 可导入授权资料并填写专属结构化字段；未实现这些平台的直接授权 API / MCP 连接，不能冒充已接入。                                         |

服务器环境变量：`DATABASE_URL`（必需）、`YOUTUBE_API_KEY`（可选）、`OPENAI_API_KEY`（可选）、`OPENAI_MODEL`（默认 `gpt-4o-mini`）。不要将密钥提交进 Git 或填入来源 URL。网页只返回配置是否存在，不返回密钥。`.env.example` 为无外部凭据的开发示例。

云环境需要出站访问 npm 官方仓库、Prisma 官方引擎域名 `binaries.prisma.sh` 以及启用的来源域名。Node 24 的 `NODE_USE_ENV_PROXY=1` 已写入启动和同步脚本，用于环境提供的代理；没有代理时仍可直连。不禁用 TLS、签名或校验和。

批量同步：`npm run sync`，顺序执行已启用来源，每来源最多 3 次重试、2/4 秒退避。此命令每次执行一轮；定期同步需在受控调度器中调用，不会默认创建系统定时任务或消耗 API 配额。后台任务与用户手动同步不应重叠执行。

## 导入格式

必需：`title`, `url`, `platform`, `country`（`Global` 或双字母国家代码）, `language`, `type`。

可选：`originalTitle`, `summary`, `keywords`, `scene`, `mechanisms`, `emotions`, `publishedAt`, `details`（字符串/数值/布尔/null 字段）, `sourceKey`（来源内稳定标识），`snapshots`。

每条 snapshot 必须有：`metric`、非负 `value`、ISO UTC `capturedAt`、`provenance`。不能把估算 DAU、收入或观看量当作实际指标。CSV 的数组 / 对象字段填写 JSON 字符串并按标准 CSV 引号转义。

去重键为 SHA-256(platform + country + sourceKey 或 URL)。同一链接在不同市场分别保留；RSS 中相同链接的不同关键词不会误合并。原始链接保留，不从链接构造虚构文章。

## 评分与证据

- Heat：同平台、国家、内容类型、指标定义及出处的样本内百分位，至少 3 个样本才计算。不同平台的绝对播放量不混算。
- Local / Playable / Viral：人工或 AI 的主观 0–100 判断，缺失为 null。
- Confidence：来源链接、新鲜度、指标和样本充分性的透明启发式，不是真假概率，也不是验证过的预测模型。默认初始权重 25/30/25/20，可调整。
- Opportunity：完整子分数的加权值再乘以 Confidence；缺一项即不输出机会分数。
- Growth：仅同一指标、同一出处且有对应时间窗口快照才计算，基线距离不得超过窗口的 125%；近似下界与零基线不计算增长。生命周期只在具备 24h 可比数据时判断。
- 每次导入、分析及调整权重记录评分结果、证据分析、规则版本和权重。AI 模型 / Prompt 版本写入分析与创意；评分历史可在详情读取。热度统计不代表传播机制导致传播。

## 验证

```bash
npm run lint       # TypeScript 严格检查
npm test           # 算法、聚类、导入校验与创意结构测试
npm run build
# 先启动 PostgreSQL 和 npm start；需系统 chromium
npm run test:e2e
```

端到端测试覆盖真实 PostgreSQL 写入、非法导入拒绝、三方向创意生成、修改状态、版本保存、三种导出、11 个模块、移动端横向布局和来源失败日志。测试资料有明确前缀并在测试结束后清除，不显示为真实热点。

## 范围与后续

这是可运行的首个开发版本，并非 V2 全量验收完成。所有 11 个模块有入口与共享工作流；以下能力仍需后续开发或真实授权验证：第三方付费平台直接连接、完整视频理解/授权素材上传、多语言 UI、榜单自动采集、机制统计显著性、专业周报编辑、调度管理、跨用户认证与权限。当前不具备公网多用户部署所需的访问控制，应作为内部单用户工作台置于受保护网络或认证网关后使用。

[原始 V2 需求](docs/requirements-v2.md) 保留了收到的文本；原文件在第 12.3 节第 10 条末尾截断，未提供的后续内容未作臆测。

## 上线访问

已提供 Dockerfile、railway.toml 与容器启动入口。按 [Railway 部署步骤](docs/DEPLOYMENT.md) 连接托管 PostgreSQL，配置网站登录用户名和密码。部署配置已准备，不代表已经发布；云开发环境与网站托管是两回事。
