# EvoMeme Trend Radar V2.0
## 全球热点监测、病毒传播机制分析与 AI 游戏创意工作台

### 0. 你的角色与开发目标

你是一名资深全栈工程师、数据工程师、AI 产品架构师、海外增长分析师和游戏创意策划。

请为 EvoMeme 设计并开发一套可真实运行的 Web 工具：

**EvoMeme Trend Radar**

产品定位：

**Discover What's Trending. Make It Playable.**

本工具不是普通的热搜聚合网站，而是为 EvoMeme 海外内容运营、社群运营、用户增长和小游戏策划服务的智能热点情报系统。

核心工作流：

**热点发现 → 本土文化洞察 → 病毒传播机制分析 → 游戏创意生成 → 内容生产 → 发布复盘**

工具需要实现五个目标：

1. 发现全球以及目标地区正在传播的 Meme、AI、游戏、娱乐和生活热点。
2. 追踪热门小游戏、Playable Ads、爆款短视频，分析其传播规律和玩法机制。
3. 深入理解菲律宾、巴基斯坦、欧美用户的真实生活场景、语言表达和文化共鸣。
4. 将适合的热点转化为 EvoMeme 可制作的原创小游戏、AI 创作提示词、短视频选题和社群活动。
5. 建立持续更新的数据资料库，让运营人员能分析、筛选、收藏、比较、制作和复盘。

请开发真实可运行的产品，不要只生成 PRD、静态页面或模拟数据 Dashboard。

---

# 一、EvoMeme 项目背景

EvoMeme 是一个 AI-powered creative playground。

用户可以把自己的想法、Meme、图片、故事或生活经历转化成可玩的小游戏。

产品主要包含：

- PLAY：体验不同创作者制作的小游戏。
- MAKE：使用 AI，无需编程制作游戏。
- SHARE：分享作品、传播创意。
- REMIX：基于已有作品进行魔改和二次创作。
- Circles：围绕游戏类型、内容风格和用户兴趣形成社区。

产品内容覆盖：

- 休闲小游戏
- 解压游戏
- Meme 游戏
- 恶搞游戏
- 解谜游戏
- 互动故事
- FMV Games
- 点击与反应挑战
- 轻度策略游戏
- Roguelike
- 其他适合 AI 快速生成的短时游戏

内容运营特别关注：

- 容易理解、容易点击的玩法
- 具有视觉冲击和即时反馈的内容
- 适合短视频传播的游戏体验
- 3–5 分钟能够完成的小游戏
- 可以产生搞笑、惊喜、失败和反转的内容
- 适合与朋友分享或挑战的玩法
- 可以被大量用户 Remix 的模板化创意

工具所有分析最终都要服务于以下问题：

**这个热点能否帮助 EvoMeme 获得曝光、吸引用户试玩，或者激发用户自己制作游戏？**

但需要区分消费侧和创作者侧价值，不能把二者混成一个指标。

---

# 二、目标市场与语言

## 2.1 地区优先级

P0：核心市场

- Philippines（PH）
- Pakistan（PK）

P1：重要国际市场

- United States（US）
- United Kingdom（GB）
- Canada（CA）
- Germany（DE）
- France（FR）

P2：扩展市场

- Global
- 其他欧洲国家
- Southeast Asia
- Latin America
- 用户自定义国家

必须能够单独筛选国家，不要仅提供 Asia、Europe 等笼统地区分类。

支持多国家对比，并预留新增市场配置。

## 2.2 语言要求

管理后台默认中文，支持以后切换英文。

采集内容保留原始语言，同时提供中文翻译和解释。

重点支持：

菲律宾：
- English
- Taglish
- Filipino / Tagalog
- 其他实际可获取的当地语言

巴基斯坦：
- English
- Roman Urdu
- Urdu

欧美：
- English
- German
- French
- 其他适用语言

对于当地语言梗，分析需要解释：

- 原文是什么
- 中文含义
- 直译与真实含义的区别
- 哪些语境下使用
- 为什么好笑或容易引起共鸣
- 是否有文化敏感性
- 目标地区是否真的存在传播证据

禁止仅凭国家刻板印象生成所谓“本地热门内容”。

---

# 三、产品整体信息架构

建议采用桌面优先的 Web Dashboard。

左侧导航包含以下模块：

1. Dashboard — 热点总览
2. Trend Discovery — 全球热点发现
3. Local Pulse — 本土生活与文化热点
4. Game Radar — 热门小游戏追踪
5. Creative Ads & Shorts — 广告与短视频雷达
6. Viral Mechanics — 病毒传播机制分析
7. Idea Lab — 游戏与内容创意工厂
8. Watchlist — 自定义监控
9. Idea Library — 创意与选题管理
10. Reports — 日报、周报和趋势复盘
11. Data Sources & Settings — 数据源及系统设置

功能允许通过共享组件实现，但核心工作流必须互通。

例如：

在 Local Pulse 中发现热点后，可以进入其详情页，查看 Viral Mechanics 的分析结果，再一键生成 Idea Lab 创意。

---

# 四、Dashboard：热点总览

首页应该能够让运营人员在数分钟内完成每日热点筛选。

## 4.1 顶部筛选条件

支持：

地区：
- Global
- PH
- PK
- US
- GB
- CA
- DE
- FR
- 多选国家

时间：
- 最近 3 小时
- 最近 24 小时
- 最近 3 天
- 最近 7 天
- 最近 30 天
- 自定义时间

内容类型：
- Meme
- Local Life
- Entertainment
- AI
- Gaming
- Mini Games
- Playable Ads
- Short Videos
- Social Challenges

来源平台：
- TikTok
- YouTube
- Instagram
- Facebook
- Reddit
- Google Trends
- Web Games
- App Stores
- News / RSS
- Third-party Intelligence

趋势状态：
- Emerging
- Breaking Out
- Sustained
- Fading
- Insufficient Data

## 4.2 首页功能区

至少包含：

**A. Trending Now**

当前最值得关注的热点。

**B. Rising Trends**

增长速度较快的新兴热点。

**C. Local Pulse**

菲律宾和巴基斯坦本地生活话题。

**D. Trending Games**

正在受关注的热门小游戏和玩法。

**E. Viral Shorts**

具有高传播参考价值的短视频。

**F. Creative Ads**

值得借鉴的游戏广告与可玩性广告。

**G. EvoMeme Opportunities**

适合转化为 EvoMeme 游戏和宣传内容的机会。

**H. Today's Picks**

系统推荐的每日重点选题。

默认按照分析分数和证据可靠性推荐，但允许用户自行排序。

任何数据模块都必须展示：

- 来源平台
- 原始链接
- 所属国家
- 原始语言
- 采集时间
- 公开可验证的热度指标
- 当前趋势状态
- 评分与证据可信度

需要清楚标注数据缺失和来源不可用状态。

---

# 五、Trend Discovery：全球热点发现

这是整个系统的数据发现中心。

## 5.1 监测范围

### A. 全球 Meme 与互联网热梗

包含：

- Meme 图片与模板
- 流行短句
- 网络黑话
- 网络挑战
- 流行表情
- 动物 Meme
- 反转类视频
- 荒诞幽默
- 年轻人文化
- 游戏相关 Meme
- 现实生活共鸣型 Meme

重点不是追踪已经流行数年的经典 Meme，而是及时发现近期出现、重新流行或产生新变体的 Meme。

同一个 Meme 可以关联多个变体。

### B. AI 相关热点

包含：

- AI 应用
- AI 游戏
- AI 生成视频
- AI 图片
- AI 创作工具
- AI 娱乐体验
- 新兴 AI 内容形式
- 用户自发传播的 AI 创意

### C. 游戏相关热点

包含：

- 热门游戏事件
- 游戏玩法趋势
- 游戏梗
- 游戏角色相关传播现象
- 新兴游戏类型
- 玩家挑战
- 创作者游戏案例
- 游戏社区热门话题

### D. 大众文化热点

包含：

- 娱乐
- 影视
- 动漫
- 音乐
- 体育
- 校园生活
- 职场
- 社交关系
- 消费文化
- 节日

不要求所有内容都与 AI 或游戏直接相关。

重点分析它们是否具备可玩化潜力。

## 5.2 热点详情

每个 Trend 应展示：

- 热点名称
- 原始名称
- 简要中文解释
- 主要传播地区
- 相关语言
- 来源平台
- 原始内容链接
- 典型传播案例
- 首次发现时间
- 最近采集时间
- 可验证热度数据
- 历史热度走势
- 相关关键词
- 关联 Meme
- 关联视频或游戏
- 文化背景
- 生命周期判断
- 是否适合 EvoMeme
- AI 玩法分析
- 收藏及创建创意入口

保留原始证据，AI 解释不应覆盖原始数据。

---

# 六、Local Pulse：本土生活与文化洞察

这是 EvoMeme Trend Radar 的第一项差异化核心能力。

目标：

**不仅知道当地用户在刷什么，还要理解他们每天经历什么、吐槽什么、为什么共鸣。**

## 6.1 建立本土生活场景分类

至少支持：

### Campus & School
- 课间
- 大学生活
- 考试
- 宿舍
- 学校规则
- 学生社交
- 毕业
- 课堂恶搞

### Work & Daily Stress
- 上班
- 通勤
- 打工生活
- 周一综合征
- 工作压力
- 收入与消费
- 摸鱼
- 职场关系

### Friends & Relationships
- 朋友群聊
- 友情
- 恋爱
- 约会
- 社交尴尬
- 家庭关系
- 室友

### Food & Lifestyle
- 当地食物
- 饮料
- 餐饮消费
- 生活习惯
- 天气体验
- 日常购物

### Entertainment & Gaming
- 休闲游戏
- 手机游戏
- 游戏角色
- 电竞
- 动漫
- 音乐
- 影视
- 流行娱乐

### Sports & Events
- 当地体育
- 校园赛事
- 重大比赛
- 节日
- 社区活动
- 季节性话题

分类系统需要支持新增和编辑。

## 6.2 菲律宾重点监测场景

建议建立关键词组：

- Student Life
- Exam Week
- Commute
- Jeepney
- Barkada
- Family
- Mobile Gaming
- Pinoy Humor
- Taglish Slang
- Local Entertainment

这些只能作为初始检索和监测方向，不能默认这些话题正在流行。

## 6.3 巴基斯坦重点监测场景

建议建立关键词组：

- University Life
- Exam Stress
- Hostel Life
- Cricket
- Family Gatherings
- Wedding Humor
- Chai
- Mobile Gaming
- Roman Urdu Memes
- Daily Life

同样，需要用真实数据验证具体趋势。

## 6.4 欧美监测

按具体国家分别追踪：

- Gen Z Humor
- College Life
- Workplace Humor
- Dating
- Gaming Culture
- Absurd Humor
- Internet Challenges
- Nostalgia
- Pop Culture
- Everyday Frustrations

不能把美国的热点自动视为欧洲热点。

## 6.5 本土文化分析引擎

对每个候选话题建立以下分析链：

国家 / 地区  
↓  
真实生活场景  
↓  
用户情绪  
↓  
Meme 表达  
↓  
传播案例  
↓  
可玩化机会

情绪标签至少包含：

- Relatable
- Frustrating
- Funny
- Awkward
- Nostalgic
- Satisfying
- Competitive
- Surprising
- Absurd
- Exciting

一条内容允许多个情绪标签。

## 6.6 Local Pulse 输出

每条本土洞察需要输出：

1. 生活场景
2. 热点描述
3. 当地语言表达
4. 中文解释
5. 用户共鸣点
6. 典型传播内容
7. 关联 Meme
8. 目标受众
9. 文化敏感性
10. 适合的游戏玩法
11. 适合的视频内容
12. 数据来源
13. 分析可信度

需要支持同一个主题在菲律宾、巴基斯坦和欧美之间进行对比。

例如：

“考试前没有复习”可能是跨国家生活主题，但各国具体语言、表达方式和传播内容不同。

必须保留共性和地区差异。

---

# 七、Game Radar：热门小游戏与玩法追踪

目标：

发现哪些游戏受欢迎，以及它们的玩法为什么容易吸引玩家。

## 7.1 重点监测方向

建议包含：

- Poki
- CrazyGames
- itch.io
- Google Play
- Apple App Store
- 其他可配置的小游戏平台
- AI 游戏创作平台

可以监测的竞品或参考平台包括：

- Rosebud AI
- GameWave
- Sekai
- 其他可获得公开数据的平台

不要假设所有平台都存在公开排行榜或可用 API。

## 7.2 游戏分类

- Puzzle
- Arcade
- Simulation
- Hypercasual
- Casual
- Idle
- Platformer
- Roguelike
- Physics
- Satisfying
- Meme Games
- Interactive Story
- Horror
- Multiplayer
- AI-generated Games

## 7.3 游戏详情分析

每款游戏记录：

- 游戏名称
- 游戏链接
- 所属平台
- 来源国家或市场
- 榜单位置（仅存在真实公开榜单时）
- 榜单历史
- 游戏类型
- 视觉风格
- 核心玩法
- 操作方式
- 游戏循环
- 失败机制
- 奖励反馈
- 单局时长（无法验证时标记估计）
- 是否适合移动端
- 是否适合短视频
- 是否存在分享机制
- 是否容易二次创作
- 制作复杂度
- EvoMeme 可借鉴点

## 7.4 游戏机制标签

建立可复用机制库：

- One-button Control
- Physics Destruction
- Satisfying Feedback
- Precision Challenge
- Time Pressure
- Escape
- Merge
- Upgrade
- Collection
- Random Events
- Multiple Endings
- Funny Failure
- Endless Challenge
- Cooperative / Competitive
- Remixable Rules

允许一个游戏关联多个机制。

## 7.5 游戏趋势分析

在拥有足够历史数据时，比较：

- 排名变化
- 上榜持续时间
- 相似题材增长情况
- 不同市场的表现
- 新玩法出现频率
- 短视频传播关联

无法获取 DAU、下载量或收入时，不允许猜测具体数字。

必须区别：

“平台榜单热门”和“跨平台真正流行”。

---

# 八、Creative Ads & Shorts：广告及短视频雷达

本模块需分成两个独立 Tab。

## 8.1 Viral Shorts

重点来源：

- TikTok
- YouTube Shorts
- Instagram Reels
- Facebook Reels
- 其他可合法获取的数据源

监测内容：

- 游戏短视频
- AI 生成内容
- Meme 视频
- 游戏挑战
- 解压视频
- 搞笑失败视频
- 实验性互动内容
- 生活共鸣短视频

### 视频详情

包含：

- 原始链接
- 平台
- 发布账号
- 发布时间
- 采集时间
- 地区关联
- 标题
- 标签
- 可获取的播放量
- 点赞
- 评论
- 分享
- 视频长度
- 可访问缩略图
- 视频内容摘要
- Hook 结构
- 传播分析

不能根据不可访问的视频内容编造具体镜头。

## 8.2 Playable Ads

重点追踪：

- 游戏广告
- 可互动试玩广告
- 伪装成小游戏的视频广告
- 高点击动机的游戏素材
- 失败演示
- 误导性选择
- 解压类操作
- 升级成长
- 猜谜和互动挑战

候选来源：

- TikTok Creative Center
- Meta Ad Library
- AppGrowing
- SocialPeta
- Apptica
- 其他授权广告情报平台

对于付费来源，先搭建连接配置和数据导入接口。

不能通过绕过登录、验证码、访问限制或其他未经授权的方式获取数据。

### 广告详情

记录：

- 广告名称
- 广告主
- 来源
- 原始链接
- 国家
- 首次观察时间
- 最近观察时间
- 素材类型
- 是否真正可试玩
- 是否存在可访问预览
- 玩法
- 核心吸引点
- 失败与奖励反馈
- 视觉风格
- CTA
- 可借鉴内容

普通视频广告不能错误标记为 Playable Ad。

## 8.3 广告与短视频结构化分析

尽可能识别：

1. 前 3 秒 Hook
2. 主要视觉刺激
3. 冲突或悬念
4. 互动欲望
5. 失败和反转
6. 奖励反馈
7. 传播动机
8. CTA
9. 可复用创意
10. 适合的 EvoMeme 游戏形式

无法直接读取视频时，允许用户上传授权素材或填写人工分析。

---

# 九、Viral Mechanics：病毒传播机制分析引擎

这是第二项差异化核心能力。

**必须作为独立核心模块开发，而不只是热点详情里的一段 AI 文字。**

目标：

解释热门内容为什么让用户想点击、继续观看、试玩、重试、评论、转发或二创。

## 9.1 传播机制标签体系

建立标准标签库，至少包含：

### Fail & Retry

典型表现：

- 游戏失败
- 滑稽失误
- 明明很简单却一直失败
- 激发重试欲望

### Satisfying

典型表现：

- 破坏
- 清理
- 整理
- 连锁反应
- 视觉爽感
- 即时反馈

### Impossible Choice

典型表现：

- 二选一
- 艰难抉择
- 道德困境
- 选择导致意外结果

### Guess & Reveal

典型表现：

- 猜答案
- 悬念
- 隐藏信息
- 最后揭晓
- 意外反转

### Challenge

典型表现：

- 限时
- 高难度
- 排行榜
- 与朋友竞争
- 连续挑战

### Remixable

典型表现：

- 模板二创
- 更换角色
- 改变规则
- 同一个创意产生多个版本

### Social Identity

典型表现：

- 人格测试
- 群体身份
- 地域文化
- 同龄人共鸣
- 社交表达

### Absurd Humor

典型表现：

- 荒诞
- 无厘头
- 意外行为
- 反常识的幽默

### Curiosity Gap

典型表现：

- 未揭晓答案
- 结果悬念
- 反常识开头
- 让人想知道下一步

支持一个内容拥有多个机制标签。

不要强行将所有内容归类为单一标签。

## 9.2 传播机制分析字段

对每条具备分析条件的内容输出：

- 传播机制标签
- 前 3 秒 Hook
- 用户为什么停下来
- 用户为什么继续观看
- 用户为什么想互动
- 用户为什么想分享
- 是否激发重试
- 是否具有社交身份表达
- 情绪曲线
- 视觉反馈
- 可复用玩法
- 可复用视频结构
- EvoMeme 应用方向
- 来源证据
- AI 分析可信度

区分：

- 有原始视频或文字证据支持的观察
- 基于部分信息的合理推断
- 创意建议

## 9.3 Viral Pattern Library

建立传播机制案例库。

用户可以按以下条件查询：

- 国家
- 平台
- 视频类型
- 游戏类型
- 传播机制
- 情绪标签
- 热度
- 时间范围

例如：

查询“菲律宾 + Fail & Retry + 游戏短视频”，可以得到符合条件的真实案例。

如果没有数据，明确显示没有足够案例，而不是生成虚假结果。

## 9.4 传播机制趋势

有足够数据时比较：

- 哪些机制近期出现更多
- 哪些机制在不同市场被频繁使用
- 哪些视频结构得到更高互动
- 哪些小游戏玩法和短视频形式存在关联

跨平台指标不可直接混算。

注意：

传播机制标签和热度之间的统计相关性，不等于这种机制必然导致传播。

---

# 十、Idea Lab：热点到游戏创意工厂

这是第三项差异化核心能力。

**Idea Lab 必须与前面所有数据模块联动。**

用户应能够在任意热点、游戏、广告或短视频详情中点击：

**Turn Into Game Idea**

系统自动带入：

- 热点名称
- 来源
- 地区
- 文化背景
- 生活场景
- 情绪
- 传播机制
- 可参考的玩法
- 已识别风险

## 10.1 每个热点生成三种创意方向

### Idea A：Quick Prototype

强调：

- 简单操作
- 少量素材
- 低开发复杂度
- 快速测试
- 3–5 分钟体验

### Idea B：Viral-first

强调：

- 视觉吸引力
- 高互动
- 搞笑失败
- 悬念与反转
- 容易分享
- 适合短视频

### Idea C：Creative Twist

强调：

- 原创性
- 玩法差异
- 强烈记忆点
- 意料之外的反馈
- Remix 潜力

## 10.2 每个创意的完整输出结构

必须包括：

1. Game Title
2. 中文名称
3. One-line Pitch
4. Target Audience
5. Target Market
6. Trend Inspiration
7. Core Gameplay
8. Main Controls
9. Game Loop
10. Win / Lose Conditions
11. Difficulty Progression
12. Expected Session Length
13. Art Direction
14. Visual Feedback
15. Funny / Surprise Moments
16. Replayability
17. Shareable Result
18. Remix Opportunities
19. Cultural Considerations
20. Production Complexity
21. Viral Potential
22. EvoMeme Fit

## 10.3 自动生成游戏 Prompt

提供可直接复制使用的英文 Prompt。

Prompt 至少包含：

- 游戏目标
- 游戏规则
- 角色与场景
- 操作方式
- 核心循环
- 难度递进
- 视觉风格
- UI
- 教学流程
- 游戏反馈
- 胜负结果
- 分享与重玩机制
- 移动端适配要求

Prompt 应当适合交给 EvoMeme 或其他 AI 游戏开发工具。

不能只输出一句简单的游戏概念。

## 10.4 自动生成宣传内容

每条创意可生成：

- 3 秒 Hook
- 15 秒短视频脚本
- 30 秒短视频脚本
- 视频标题
- TikTok 文案
- Instagram Reels 文案
- YouTube Shorts 标题
- 社区互动话题
- Remix Challenge 玩法
- 英文版及适当的本地化版本

重点考虑：

- 如何让玩家愿意点击试玩
- 如何让观众理解游戏玩法
- 如何引导用户自行创作
- 如何激发评论和分享

## 10.5 Idea Library

生成后的创意可以：

- 收藏
- 编辑
- 评分
- 添加标签
- 关联热点
- 关联传播机制
- 记录参考视频
- 保存不同版本
- 导出 Markdown
- 导出 JSON
- 导出 CSV 列表
- 复制游戏 Prompt

状态管理：

- Backlog
- Evaluating
- Approved
- In Production
- Published
- Reviewing
- Archived

发布后允许填写：

- 游戏链接
- 视频链接
- 内容形式
- 发布地区
- 播放量
- 点击量
- 试玩量
- 分享量
- 有效新增
- 其他人工录入的数据

用于后续效果复盘。

未经数据验证不能自动宣称某条创意已带来新增。

---

# 十一、趋势算法与综合推荐

建立透明、可配置的评分体系。

不要简单将播放量最大的内容排在第一。

至少输出五个独立指标：

**Heat Score：客观热度**

考虑公开可验证的热度指标、历史表现和可比范围内的相对位置。

**Local Relevance：地区相关性**

考虑：

- 是否有目标地区的真实传播证据
- 是否符合本地语境
- 是否存在当地语言或文化关联
- 是否与目标受众生活相关

**Playable Potential：可玩化潜力**

考虑：

- 操作是否容易理解
- 是否可以形成完整游戏循环
- 是否有反馈与挑战
- 能否在短时间产生体验
- 是否适合 AI 快速制作

**Viral Potential：传播潜力**

考虑：

- Hook
- 情绪反馈
- 新奇性
- 反转
- 分享机制
- 二创能力

**Data Confidence：数据可信度**

考虑：

- 来源是否可靠
- 是否存在原始链接
- 数据是否足够新
- 是否有多个独立证据
- 数据是否完整
- 是否存在无法核实的推断

所有评分范围为 0–100。

## 11.1 算法要求

- 客观热度和 AI 主观判断分开计算。
- 对不同平台、国家和内容类型进行归一化。
- 不允许直接比较不同来源的绝对播放量。
- 对低样本内容标注低置信度。
- 新热点不能仅因为缺少历史数据就被直接过滤。
- 不同国家的榜单需要分别排序。
- 支持用户修改推荐权重。
- 输出评分原因。
- 保留评分历史。
- AI 模型版本、提示词版本和评分规则版本可追溯。

可以设计一个综合 Opportunity Score，但必须保留各子分数，不能用一个数字掩盖证据不足的问题。

例如，默认评分可使用：

- Local Relevance：25%
- Playable Potential：30%
- Viral Potential：25%
- Heat Score：20%

但必须额外引入 Data Confidence 作为证据质量提示或可信度校正，不能将没有数据支持的高分当成真实推荐。

该权重只是可配置初始值，不是已经验证的预测模型。

## 11.2 趋势生命周期

支持：

- Emerging
- Breaking Out
- Sustained
- Fading
- Insufficient Data

历史数据不足时，禁止伪造增长率。

有历史快照后再分析：

- 3h Growth
- 24h Growth
- 7d Growth
- 30d Growth

只有同一来源、同一指标定义、可比较的快照才允许计算增长。

---

# 十二、数据采集与来源管理

本系统必须使用真实数据架构。

## 12.1 Connector 设计

对每个数据源单独实现适配器。

统一支持：

- 配置
- 连接测试
- 数据获取
- 数据校验
- 格式标准化
- 去重
- 历史快照
- 同步日志
- 错误处理
- 失败重试
- 健康监测

建立 Source Registry。

每个数据源显示：

- 来源名称
- 接入方式
- 授权状态
- 是否启用
- 最近成功采集时间
- 最近失败时间
- 当前错误
- 支持国家
- 支持内容类型
- 指标可用情况
- 速率和额度限制

## 12.2 数据源优先级

### P0：优先实现

- Google Trends 可合法访问的 RSS / 导出
- YouTube Data API
- 可用的公开 RSS 信息源
- 公开游戏资讯数据
- 手动 URL 导入
- CSV / JSON 导入

YouTube 等需要密钥的来源应实现配置入口。

缺少 API Key 时，不要阻止其他功能运行。

### P1：增强接入

- Reddit 官方授权接口
- 游戏平台合法可获取的数据
- TikTok Creative Center 可访问数据或授权导入
- Meta Ad Library 支持的数据
- App Store 合规榜单数据

### P2：商业情报数据

- AppGrowing
- SocialPeta
- Apptica
- 其他授权数据商

支持通过 API、MCP、CSV 或其他合规方式扩展。

不得假设所有平台都有完全开放的 API。

## 12.3 采集原则

严格要求：

1. 不绕过登录、验证码或平台访问限制。
2. 不伪造 API 返回值。
3. 不将用户个人信息作为默认采集目标。
4. 仅保留业务分析必要的公开信息。
5. 尊重平台授权、版权和相关规则。
6. 第三方视频优先使用合法嵌入或原链接。
7. 不默认下载或永久存储未经授权的视频素材。
8. 数据源不可用时明确显示状态。
9. AI 不得填补不存在的真实数据。
10. 不允许把 Demo 数据显示成实时