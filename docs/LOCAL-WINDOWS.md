# Windows 本地使用

这是在自己电脑上运行、用浏览器操作的版本，不需要 Railway、云服务器或另外安装 PostgreSQL。目前是源码启动包，不是已签名的独立 EXE。

## 第一次使用

1. 安装官方 [Node.js 24 LTS](https://nodejs.org/) 的 Windows x64 版本，保留安装器默认选项。
2. 把 ZIP 完整解压到一个自己有写入权限的文件夹，例如 `D:\EvoMeme-Radar`。不要直接在压缩包里运行。
3. 双击 `start-windows.bat`。
4. 第一次会联网安装依赖、初始化本地数据库并构建应用，需要等待。看到 `READY` 后会自动打开浏览器中的「每日选题」。
5. 使用过程中保留命令窗口；结束时在窗口中按 Ctrl+C。下一次仍双击同一个 BAT 文件，构建可复用。

建议使用普通用户运行。Windows ARM 原生 Node 不是本次准备和验证的目标；上游本地 PostgreSQL 二进制包提供 Windows x64 支持。本次只在 Linux 环境验证了同一 Node 启动逻辑，尚未进行 Windows 真机验收。

## 每日选题

新增页面参考用户指定的 Meme & Game Repo 的信息组织方式：日期归档、游戏选题 / Meme 切换、搜索、制作难度、只看人工推荐、可展开的选题详情和复制 Prompt。界面继续使用 EvoMeme 的组件，没有复制对方的选题或热度数据。

新安装时资料库为空。在每日选题底部点击「获取 PH / PK 热点」尝试同步真实 RSS；或通过右上角导入授权资料。进入热点详情生成三种游戏创意后，它们会出现在对应日期的每日选题中。收藏、评分至少 4 星或 Approved 状态才会显示人工推荐标记。日期按北京时间计算。

RSS、YouTube 和 AI 服务需要联网；外网访问失败会显示实际错误，可使用手动 URL / 文件导入。OpenAI 和 YouTube 密钥不是本地启动所必需的；缺少 OpenAI 密钥时生成明确标记的规则草案，不虚构 AI 结果。

## 数据与启动

- `.local/postgres`：本机数据库，保留热点、收藏、创意和版本。不要删除；备份前先正常停止程序。
- `.env`：本机配置，不会覆盖已存在的文件。不要将密钥发到聊天或提交到公开仓库。
- `.local/npm-cache`、`node_modules`、`.next`：安装和构建缓存。
- 默认端口 3030，被占用时向后查找空闲端口。以命令窗口显示的 READY 地址为准；仅监听自己电脑的 `127.0.0.1`。
- 保留上次数据库。启动失败不会重置数据；请保留窗口中的报错用于排查。

如果双击窗口提示找不到 Node，完成 Node 安装后重新打开启动文件。若网络安装失败，先确认能访问 npm 官方仓库及 Prisma 官方下载域名，然后重新启动；脚本不关闭证书校验，也不会替换 lockfile。

如需使用终端：在解压后的文件夹运行 `node scripts/local.mjs` 或 `npm run local`。无需执行 Linux 专用的 setup.sh。

## 2026-10-28 启动补丁

修复本地数据库提前退出时 `Cannot read properties of undefined (reading 'message')` 的二次报错。Windows 改用 PostgreSQL 自带的 initdb / pg_ctl，继承完整系统环境，不再依靠解析英文日志判断是否就绪。启动详情保存到 `.local/postgres-startup.log`，错误会保留实际退出码和原始诊断。

已有用户下载更新后的 windows-local 分支 ZIP，只需将其中整个 `scripts` 文件夹复制到旧程序目录、替换同名文件，然后再次运行旧目录的 `start-windows.bat`。保留旧目录的 `.env`、`.local`、`node_modules`，无需重装或清空数据。

若仍失败，请提供窗口底部诊断或 `.local/postgres-startup.log` 的最后约 30 行。不要发送 `.env` 文件。

### server started 后停住

后续补丁修复了 Windows 后台服务器继承输出管道导致的等待：以 pg_ctl 进程退出判断命令完成，不再等待后台进程关闭管道。启动器日志改为 `.local/launcher.log`，与数据库服务的 `.local/postgres-startup.log` 分离，避免 Windows 文件共享冲突。若上次已启动数据库但未完成应用数据库创建，重试会复用已运行服务并补建缺失的应用数据库；不会清空原有数据。

关闭旧启动窗口，再按上面的方式替换整个 scripts 文件夹后重试。此次包含输出管道保持打开的回归测试，以及真实 PostgreSQL 的首次初始化、服务复用、缺失数据库恢复和重启后数据保留验证（Linux；Windows 仍需真机确认）。
