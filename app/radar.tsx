"use client";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  FlaskConical,
  Gamepad2,
  Globe2,
  LayoutDashboard,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Video,
  X,
  Zap,
  FileText,
  Layers3,
  Eye,
} from "lucide-react";
import {
  countries,
  types,
  mechanisms,
  scenes,
  emotions,
  statuses,
  defaultWeights,
  editionDay,
} from "@/lib/domain";
import type { Weights } from "@/lib/domain";
type Snapshot = {
  metric: string;
  value: number;
  capturedAt: string;
  provenance: string;
};
type Analysis = {
  translation?: string;
  literalMeaning?: string;
  culturalContext?: string;
  sensitivity?: string;
  observations?: { claim: string; evidence: string }[];
  inferences?: string[];
  suggestions?: string[];
  scores?: { local: number; playable: number; viral: number };
  [key: string]: unknown;
};
type Trend = {
  id: string;
  title: string;
  originalTitle: string;
  summary: string;
  url: string;
  platform: string;
  country: string;
  language: string;
  type: string;
  scene: string;
  keywords: string[];
  mechanisms: string[];
  emotions: string[];
  firstSeen: string;
  collectedAt: string;
  favorite: boolean;
  analysis: Analysis | null;
  details: Record<string, string | number | boolean | null> | null;
  snapshots: Snapshot[];
  score: {
    heat: number | null;
    local: number | null;
    playable: number | null;
    viral: number | null;
    confidence: number;
    opportunity: number | null;
    growth24: number | null;
    state: string;
    reason: string;
    cohortSize: number;
  };
  _count: { ideas: number };
};
type Idea = {
  id: string;
  title: string;
  direction: string;
  status: string;
  content: Record<string, string>;
  prompt: string;
  campaign: Record<string, string>;
  favorite: boolean;
  rating: number | null;
  tags: string[];
  outcomes: Record<string, string | number> | null;
  trend: Trend;
  createdAt: string;
  versions: { id: string; createdAt: string; data: unknown }[];
};
type Source = {
  id: string;
  name: string;
  kind: string;
  url: string;
  country: string;
  enabled: boolean;
  lastSuccess: string | null;
  error: string | null;
  logs: {
    id: string;
    status: string;
    count: number;
    message: string | null;
    createdAt: string;
  }[];
};
type Watch = { id: string; keyword: string; country: string };
const nav = [
  { path: "/daily", label: "每日选题", en: "Daily Brief", icon: FileText },
  {
    path: "/dashboard",
    label: "热点总览",
    en: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/discover",
    label: "全球热点发现",
    en: "Trend Discovery",
    icon: Compass,
  },
  { path: "/local", label: "本土文化洞察", en: "Local Pulse", icon: Globe2 },
  { path: "/games", label: "小游戏雷达", en: "Game Radar", icon: Gamepad2 },
  { path: "/creative", label: "广告与短视频", en: "Ads & Shorts", icon: Video },
  { path: "/mechanics", label: "传播机制", en: "Viral Mechanics", icon: Zap },
  { path: "/lab", label: "创意工厂", en: "Idea Lab", icon: FlaskConical },
  { path: "/watchlist", label: "自定义监控", en: "Watchlist", icon: Eye },
  { path: "/library", label: "创意资料库", en: "Idea Library", icon: Layers3 },
  { path: "/reports", label: "报告与复盘", en: "Reports", icon: FileText },
  {
    path: "/sources",
    label: "数据源与设置",
    en: "Sources & Settings",
    icon: Settings2,
  },
];
const when = (v: string | null) =>
  v
    ? new Date(v).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "尚无记录";
const labels: Record<string, string> = {
  gameTitle: "Game Title",
  chineseTitle: "中文名称",
  pitch: "一句话创意",
  targetAudience: "目标受众",
  targetMarket: "目标市场",
  trendInspiration: "热点灵感",
  coreGameplay: "核心玩法",
  mainControls: "操作方式",
  gameLoop: "游戏循环",
  winLose: "胜负条件",
  difficulty: "难度递进",
  sessionLength: "单局时长",
  artDirection: "美术方向",
  visualFeedback: "视觉反馈",
  surpriseMoments: "惊喜时刻",
  replayability: "重玩价值",
  shareableResult: "分享结果",
  remixOpportunities: "Remix 机会",
  culturalConsiderations: "文化与版权",
  productionComplexity: "制作复杂度",
  viralPotential: "传播假设",
  evoMemeFit: "消费侧 / 创作者侧",
  generation: "生成方式",
  translation: "中文翻译",
  literalMeaning: "直译与真实含义",
  culturalContext: "文化语境",
  sensitivity: "文化敏感性",
  hook: "前 3 秒 Hook",
  stop: "停留动机",
  watch: "观看动机",
  interact: "互动动机",
  share: "分享动机",
  retry: "重试机制",
  identity: "社交身份",
  emotionCurve: "情绪曲线",
  visualFeedback2: "视觉反馈",
  gameplay: "可复用玩法",
  videoStructure: "可复用视频结构",
  model: "模型",
  promptVersion: "提示词版本",
  basis: "证据范围",
  createdAt: "分析时间",
};
async function request<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(
    "/api/" + path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "请求失败");
  return data;
}
function Empty({
  title = "暂无符合条件的真实数据",
  text = "添加来源或导入授权资料，开始建立你的情报库。不会以演示内容填补空白。",
  action,
}: {
  title?: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Radio size={28} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Export({ kind = "ideas", day }: { kind?: string; day?: string }) {
  return (
    <div className="inline">
      {["md", "json", "csv"].map((f) => (
        <a
          className="button subtle small"
          key={f}
          href={`/api/export/${kind}?format=${f}${day ? "&day=" + encodeURIComponent(day) : ""}`}
        >
          <ArrowDownToLine size={13} />
          {f.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
export default function Radar() {
  const path = usePathname();
  const router = useRouter();
  const current = nav.find((n) => path === n.path) ?? nav[0];
  const trendId = path.startsWith("/topics/") ? path.split("/")[2] : null;
  const [trends, setTrends] = useState<Trend[]>([]),
    [ideas, setIdeas] = useState<Idea[]>([]),
    [sources, setSources] = useState<Source[]>([]),
    [watches, setWatches] = useState<Watch[]>([]);
  const [config, setConfig] = useState({
    weights: defaultWeights,
    youtube: false,
    ai: false,
    model: "",
    scoreVersion: "",
    scenes: [] as string[],
  });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [query, setQuery] = useState(""),
    [markets, setMarkets] = useState<string[]>([]),
    [time, setTime] = useState("168"),
    [type, setType] = useState(""),
    [platform, setPlatform] = useState(""),
    [state, setState] = useState(""),
    [mechanism, setMechanism] = useState(""),
    [scene, setScene] = useState(""),
    [sort, setSort] = useState("confidence"),
    [favorite, setFavorite] = useState(false),
    [tab, setTab] = useState("Short Videos");
  const [customFrom, setCustomFrom] = useState(""),
    [customTo, setCustomTo] = useState("");
  const [modal, setModal] = useState(""),
    [importText, setImportText] = useState(""),
    [format, setFormat] = useState("json"),
    [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [scoreHistory, setScoreHistory] = useState<unknown[]>([]);
  const [dailyDay, setDailyDay] = useState(editionDay());
  const [dailyCategory, setDailyCategory] = useState("ideas");
  const [dailySearch, setDailySearch] = useState("");
  const [dailyDifficulty, setDailyDifficulty] = useState("");
  const [dailyRecommended, setDailyRecommended] = useState(false);
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const load = useCallback(async () => {
    try {
      const [t, i, s, w, c] = await Promise.all([
        request<Trend[]>("trends"),
        request<Idea[]>("ideas"),
        request<Source[]>("sources"),
        request<Watch[]>("watch"),
        request<typeof config>("settings"),
      ]);
      setTrends(t);
      setIdeas(i);
      setSources(s);
      setWatches(w);
      setConfig(c);
      setWeights(c.weights);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!modal && !selectedIdea) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.querySelector<HTMLElement>("button,input,textarea,select")?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal("");
        setSelectedIdea(null);
      }
      if (event.key === "Tab" && dialog) {
        const controls = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]",
          ),
        ).filter((e) => e.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [modal, selectedIdea?.id]);
  async function run(
    key: string,
    fn: () => Promise<unknown>,
    message = "已保存",
  ) {
    setBusy(key);
    setError("");
    try {
      await fn();
      setNotice(message);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  const trend = trends.find((t) => t.id === trendId);
  const filtered = trends
    .filter(
      (t) =>
        (!query ||
          [t.title, t.summary, ...t.keywords]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!markets.length || markets.includes(t.country)) &&
        (!type || t.type === type) &&
        (!platform || t.platform === platform) &&
        (!state || t.score.state === state) &&
        (!mechanism || t.mechanisms.includes(mechanism)) &&
        (!scene || t.scene === scene) &&
        (!favorite || t.favorite) &&
        (time === "custom"
          ? (!customFrom ||
              +new Date(t.collectedAt) >= +new Date(customFrom)) &&
            (!customTo || +new Date(t.collectedAt) <= +new Date(customTo))
          : !time ||
            Date.now() - +new Date(t.collectedAt) < Number(time) * 3600000),
    )
    .sort((a, b) =>
      sort === "newest"
        ? +new Date(b.collectedAt) - +new Date(a.collectedAt)
        : (b.score[sort as "confidence" | "opportunity" | "heat"] ?? -1) -
          (a.score[sort as "confidence" | "opportunity" | "heat"] ?? -1),
    );
  const subset =
    path === "/local"
      ? filtered.filter((t) => t.type === "Local Life" || t.scene)
      : path === "/games"
        ? filtered.filter((t) => ["Gaming", "Mini Games"].includes(t.type))
        : path === "/creative"
          ? filtered.filter((t) => t.type === tab)
          : filtered;
  function openImport() {
    setModal("import");
    setImportText("");
  }
  function Cards({ rows }: { rows: Trend[] }) {
    return rows.length ? (
      <div className="trend-grid">
        {rows.map((t) => (
          <article className="trend-card" key={t.id}>
            <div className="card-top">
              <span className="platform">{t.platform}</span>
              <button
                className={`icon ${t.favorite ? "saved" : ""}`}
                aria-label="收藏热点"
                onClick={() =>
                  run("favorite", () =>
                    request(`trends/${t.id}`, { favorite: !t.favorite }),
                  )
                }
              >
                <Bookmark
                  size={16}
                  fill={t.favorite ? "currentColor" : "none"}
                />
              </button>
            </div>
            <div className="tagline">
              <span>{t.country}</span>
              <span>{t.language}</span>
              <span>{t.type}</span>
            </div>
            <Link href={`/topics/${t.id}`} className="trend-title">
              {t.title}
            </Link>
            <p className="excerpt">
              {t.summary || "来源未提供摘要。查看原文以核实内容。"}
            </p>
            <div className="chips">
              {t.mechanisms.slice(0, 2).map((m) => (
                <span className="chip" key={m}>
                  {m}
                </span>
              ))}
            </div>
            <div className="card-score">
              <div>
                <span className="score-value">
                  {t.score.opportunity ?? "—"}
                </span>
                <small>机会评分</small>
              </div>
              <div>
                <span className="evidence">
                  {t.score.confidence}
                  <small>/100</small>
                </span>
                <small>证据质量</small>
              </div>
              <span className="status-tag">{t.score.state}</span>
            </div>
            <div className="card-footer">
              <span>{when(t.collectedAt)}</span>
              <a href={t.url} target="_blank" rel="noreferrer">
                原始证据 <ExternalLink size={12} />
              </a>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <Empty
        action={
          <button onClick={openImport} className="button">
            <Plus size={15} />
            导入资料
          </button>
        }
      />
    );
  }
  function Filters() {
    return (
      <div className="filters">
        <div className="market-row">
          <span className="filter-label">
            <Globe2 size={14} />
            国家
          </span>
          {Array.from(
            new Set([...countries, ...trends.map((t) => t.country)]),
          ).map((c) => (
            <button
              key={c}
              onClick={() =>
                setMarkets(
                  markets.includes(c)
                    ? markets.filter((x) => x !== c)
                    : [...markets, c],
                )
              }
              className={`market ${markets.includes(c) ? "active" : ""}`}
            >
              {c}
              {c === "PH" || c === "PK" ? (
                <span className="priority-dot" />
              ) : null}
            </button>
          ))}
          {markets.length > 0 && (
            <button className="text-button" onClick={() => setMarkets([])}>
              清除
            </button>
          )}
          <span className="muted right">可多选 · 按国家保留证据</span>
        </div>
        <div className="filter-row">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label="搜索热点"
              placeholder="搜索热点、关键词或生活场景…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="时间范围"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="3">最近 3 小时</option>
            <option value="24">最近 24 小时</option>
            <option value="72">最近 3 天</option>
            <option value="168">最近 7 天</option>
            <option value="720">最近 30 天</option>
            <option value="">全部时间</option>
            <option value="custom">自定义时间</option>
          </select>
          <select
            aria-label="内容类型"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">所有内容类型</option>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="来源平台"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">所有平台</option>
            {Array.from(new Set(trends.map((t) => t.platform))).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="趋势状态"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">所有趋势状态</option>
            {[
              "Emerging",
              "Breaking Out",
              "Sustained",
              "Fading",
              "Insufficient Data",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="排序"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="confidence">证据质量优先</option>
            <option value="opportunity">机会评分优先</option>
            <option value="heat">客观热度优先</option>
            <option value="newest">最近采集优先</option>
          </select>
        </div>
        {time === "custom" && (
          <div className="inline">
            <label>
              从{" "}
              <input
                type="datetime-local"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label>
              至{" "}
              <input
                type="datetime-local"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>
    );
  }
  function section(title: string, en: string, rows: Trend[]) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>
            {title}
            <span>{en}</span>
          </h2>
          <span className="muted">{rows.length} 条证据</span>
        </div>
        <Cards rows={rows.slice(0, 6)} />
      </section>
    );
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <div className="brand-icon">
            <Radio size={22} />
          </div>
          <span>
            EvoMeme<small>TREND RADAR</small>
          </span>
          <span className="version">V2</span>
        </Link>
        <div className="workspace-label">INTELLIGENCE WORKSPACE</div>
        <nav>
          {nav.map((n) => (
            <Link
              key={n.path}
              href={n.path}
              className={
                current.path === n.path && !trendId ? "nav active" : "nav"
              }
            >
              <n.icon size={18} />
              <span>
                {n.label}
                <small>{n.en}</small>
              </span>
              {n.path === "/lab" && <span className="new-badge">NEW</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="live-dot" /> 本地数据工作台
          <span>以证据发现 · 以创意连接</span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            工作台 <ChevronRight size={14} />
            <b>{trendId ? "热点详情" : current.label}</b>
          </div>
          <div className="inline">
            <span className="connection">
              <span className={error ? "warn-dot" : "live-dot"} />
              {loading ? "连接中" : "持久化资料库"}
            </span>
            <span className="avatar">E</span>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="alert" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="关闭错误">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <Check size={16} />
              {notice}
              <button onClick={() => setNotice("")} aria-label="关闭通知">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                EVOMEME INTELLIGENCE /{" "}
                {trendId ? "EVIDENCE DETAIL" : current.en.toUpperCase()}
              </div>
              <h1>
                {trendId ? "从热点，走向可玩创意" : current.label}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {trendId
                  ? "原始证据与分析分开保留，每一步判断都可以追溯。"
                  : "Discover what’s trending. Make it playable. 从全球信号中，发现下一个创作机会。"}
              </p>
            </div>
            <div className="inline">
              <button
                className="button subtle"
                disabled={!!busy}
                onClick={() => run("reload", load, "已刷新资料库")}
              >
                <RefreshCw size={15} />
                刷新
              </button>
              <button className="button" onClick={openImport}>
                <Plus size={16} />
                导入资料
              </button>
            </div>
          </div>
          {loading ? (
            <div className="empty">
              <Loader2 className="spin" />
              正在读取资料库…
            </div>
          ) : trendId ? (
            trend ? (
              <>
                <div className="detail-hero">
                  <div className="tagline">
                    <span>{trend.platform}</span>
                    <span>{trend.country}</span>
                    <span>{trend.language}</span>
                  </div>
                  <h2>{trend.title}</h2>
                  <p>{trend.summary || "无原始摘要"}</p>
                  <a
                    className="button subtle"
                    href={trend.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看原始内容 <ExternalLink size={14} />
                  </a>
                  <div className="metadata">
                    原始标题：{trend.originalTitle}
                    <br />
                    首次发现 {when(trend.firstSeen)} · 最近采集{" "}
                    {when(trend.collectedAt)} · 来源市场不等于已验证的传播范围
                  </div>
                </div>
                <div className="stats">
                  {[
                    ["Heat Score", trend.score.heat],
                    ["Local Relevance", trend.score.local],
                    ["Playable Potential", trend.score.playable],
                    ["Viral Potential", trend.score.viral],
                    ["Data Confidence", trend.score.confidence],
                  ].map(([k, v]) => (
                    <div className="stat" key={k}>
                      <span>{k}</span>
                      <strong>{v ?? "—"}</strong>
                      <small>
                        {k === "Heat Score"
                          ? "可比样本内热度"
                          : k === "Data Confidence"
                            ? "证据完整性，非真假概率"
                            : "主观判断，须审核"}
                      </small>
                    </div>
                  ))}
                </div>
                <p className="info-note">
                  {trend.score.reason} · 同类样本 {trend.score.cohortSize} · 24h
                  增长{" "}
                  {trend.score.growth24 === null
                    ? "数据不足"
                    : trend.score.growth24 + "%"}{" "}
                  · {trend.score.state}
                </p>
                <div className="detail-columns">
                  <section className="panel">
                    <div className="section-head">
                      <h2>原始证据与历史快照</h2>
                    </div>
                    {trend.snapshots.length ? (
                      <table>
                        <thead>
                          <tr>
                            <th>指标</th>
                            <th>值</th>
                            <th>观察时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trend.snapshots.map((s, i) => (
                            <tr key={i}>
                              <td>
                                {s.metric}
                                <small>{s.provenance}</small>
                              </td>
                              <td>{s.value.toLocaleString()}</td>
                              <td>{when(s.capturedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="muted">
                        没有可验证的数值指标。不会补造播放量、下载量或增长率。
                      </p>
                    )}
                    <div className="inline spaced">
                      <button
                        className="button subtle small"
                        onClick={() => setModal("details")}
                      >
                        编辑游戏 / 素材档案
                      </button>
                      <button
                        className="button subtle small"
                        onClick={() =>
                          run(
                            "history",
                            async () => {
                              setScoreHistory(
                                await request<unknown[]>(`scores/${trend.id}`),
                              );
                              setModal("history");
                            },
                            "评分历史已读取",
                          )
                        }
                      >
                        查看评分历史
                      </button>
                    </div>
                    {trend.details && (
                      <details open>
                        <summary>结构化素材档案 · 人工或来源记录</summary>
                        <dl>
                          {Object.entries(trend.details).map(([k, v]) => (
                            <div key={k}>
                              <dt>{k}</dt>
                              <dd>{v === null ? "未验证" : String(v)}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                    <h3>人工分类</h3>
                    <label>
                      生活场景
                      <select
                        value={trend.scene}
                        onChange={(e) =>
                          run("scene", () =>
                            request(`trends/${trend.id}`, {
                              scene: e.target.value,
                            }),
                          )
                        }
                      >
                        <option value="">未分类</option>
                        {[...scenes, ...config.scenes].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <div className="chips">
                      {mechanisms.map((m) => (
                        <button
                          key={m}
                          className={`chip ${trend.mechanisms.includes(m) ? "selected" : ""}`}
                          onClick={() =>
                            run("tag", () =>
                              request(`trends/${trend.id}`, {
                                mechanisms: trend.mechanisms.includes(m)
                                  ? trend.mechanisms.filter((x) => x !== m)
                                  : [...trend.mechanisms, m],
                              }),
                            )
                          }
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <h4>情绪标签</h4>
                    <div className="chips">
                      {emotions.map((m) => (
                        <button
                          key={m}
                          className={`chip ${trend.emotions.includes(m) ? "selected" : ""}`}
                          onClick={() =>
                            run("emotion", () =>
                              request(`trends/${trend.id}`, {
                                emotions: trend.emotions.includes(m)
                                  ? trend.emotions.filter((x) => x !== m)
                                  : [...trend.emotions, m],
                              }),
                            )
                          }
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="panel">
                    <div className="section-head">
                      <h2>文化与传播机制分析</h2>
                      <button
                        className="button small"
                        disabled={!!busy || !config.ai}
                        onClick={() =>
                          run(
                            "ai",
                            () => request(`trends/${trend.id}/analyze`, {}),
                            "分析已保存",
                          )
                        }
                      >
                        <Sparkles size={14} />
                        {busy === "ai" ? "分析中…" : "AI 分析"}
                      </button>
                    </div>
                    {!config.ai && (
                      <p className="info-note">
                        AI 服务未配置。可先录入人工分析；不使用虚构分析补位。
                      </p>
                    )}
                    <button
                      className="button subtle small"
                      onClick={() => setModal("analysis")}
                    >
                      录入 / 编辑人工分析
                    </button>
                    {trend.analysis ? (
                      <>
                        <dl>
                          {Object.entries(trend.analysis)
                            .filter(
                              ([, v]) => typeof v === "string" || v === null,
                            )
                            .map(([k, v]) => (
                              <div key={k}>
                                <dt>{labels[k] ?? k}</dt>
                                <dd>
                                  {v === null
                                    ? "无法从现有证据确认"
                                    : String(v)}
                                </dd>
                              </div>
                            ))}
                        </dl>
                        <h4>有证据支持的观察</h4>
                        {trend.analysis.observations?.map((o, i) => (
                          <blockquote key={i}>
                            {o.claim}
                            <small>证据：{o.evidence}</small>
                          </blockquote>
                        ))}
                        <h4>合理推断</h4>
                        {trend.analysis.inferences?.map((s, i) => (
                          <p key={i}>{s}</p>
                        ))}
                        <h4>创意建议</h4>
                        {trend.analysis.suggestions?.map((s, i) => (
                          <p key={i}>{s}</p>
                        ))}
                      </>
                    ) : (
                      <p className="muted">
                        尚无分析。来源文字不代表已观看视频，不能据此描述镜头或视觉反馈。
                      </p>
                    )}
                  </section>
                </div>
                <div className="cta-panel">
                  <FlaskConical size={28} />
                  <div>
                    <h2>让这个热点，变得可玩。</h2>
                    <p>
                      生成 Quick Prototype / Viral-first / Creative Twist
                      三类规则草案。
                    </p>
                  </div>
                  <button
                    className="button"
                    disabled={!!busy}
                    onClick={() =>
                      run(
                        "ideas",
                        async () => {
                          await request(`trends/${trend.id}/ideas`, {});
                          router.push("/library");
                        },
                        "三类创意草案已生成",
                      )
                    }
                  >
                    Turn Into Game Idea <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <Empty title="未找到热点" />
            )
          ) : (
            <>
              {[
                "/dashboard",
                "/",
                "/discover",
                "/local",
                "/games",
                "/creative",
                "/mechanics",
                "/lab",
              ].includes(path) && (
                <>
                  <Filters />
                  {(path === "/local" || path === "/mechanics") && (
                    <div className="inline extra-filters">
                      <select
                        aria-label="传播机制"
                        value={mechanism}
                        onChange={(e) => setMechanism(e.target.value)}
                      >
                        <option value="">所有传播机制</option>
                        {mechanisms.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        aria-label="生活场景"
                        value={scene}
                        onChange={(e) => setScene(e.target.value)}
                      >
                        <option value="">所有生活场景</option>
                        {[...scenes, ...config.scenes].map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {path === "/" || path === "/dashboard" ? (
                    <>
                      <div className="stats">
                        {[
                          [
                            "已采集信号",
                            filtered.length,
                            "真实资料 · 非演示数据",
                          ],
                          [
                            "优先市场信号",
                            filtered.filter((t) =>
                              ["PH", "PK"].includes(t.country),
                            ).length,
                            "Philippines / Pakistan",
                          ],
                          [
                            "上升趋势",
                            filtered.filter((t) =>
                              ["Emerging", "Breaking Out"].includes(
                                t.score.state,
                              ),
                            ).length,
                            "需可比较的历史快照",
                          ],
                          [
                            "已保存创意",
                            ideas.length,
                            "消费侧与创作者侧分开判断",
                          ],
                        ].map(([title, value, hint], i) => (
                          <div className="stat" key={title}>
                            <span>
                              {title}
                              <Activity size={15} />
                            </span>
                            <strong>
                              {value}
                              <small>{i === 3 ? "IDEAS" : "SIGNALS"}</small>
                            </strong>
                            <small>{hint}</small>
                          </div>
                        ))}
                      </div>
                      <div className="editorial-banner">
                        <div>
                          <span className="eyebrow">
                            SIGNAL → INSIGHT → PLAY
                          </span>
                          <h2>
                            世界正在讨论的，
                            <br />
                            也许就是下一个好玩的。
                          </h2>
                          <p>真实证据 × 本土语境 × 可复用的创作灵感</p>
                          <Link className="text-link" href="/lab">
                            打开创意工厂 <ArrowRight size={15} />
                          </Link>
                        </div>
                        <div className="radar-art" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                          <i />
                          <b>PLAY</b>
                        </div>
                      </div>
                      {section("正在发生", "Trending Now", filtered)}
                      {section(
                        "上升趋势",
                        "Rising Trends",
                        filtered.filter((t) =>
                          ["Emerging", "Breaking Out"].includes(t.score.state),
                        ),
                      )}
                      {section(
                        "本土脉搏",
                        "Local Pulse",
                        filtered.filter(
                          (t) => ["PH", "PK"].includes(t.country) && !!t.scene,
                        ),
                      )}
                      {section(
                        "热门小游戏",
                        "Trending Games",
                        filtered.filter((t) =>
                          ["Mini Games", "Gaming"].includes(t.type),
                        ),
                      )}
                      {section(
                        "短视频信号",
                        "Viral Shorts",
                        filtered.filter((t) => t.type === "Short Videos"),
                      )}
                      {section(
                        "创意广告",
                        "Creative Ads",
                        filtered.filter((t) => t.type === "Playable Ads"),
                      )}
                      {section(
                        "可玩化机会",
                        "EvoMeme Opportunities",
                        filtered.filter(
                          (t) => (t.score.opportunity ?? 0) >= 50,
                        ),
                      )}
                      {section(
                        "每日精选",
                        "Today’s Picks",
                        filtered
                          .filter((t) => t.score.confidence >= 60)
                          .slice(0, 3),
                      )}
                    </>
                  ) : path === "/lab" ? (
                    <>
                      <div className="cta-panel">
                        <FlaskConical size={32} />
                        <div>
                          <h2>一个热点，三种可能。</h2>
                          <p>
                            选择有原始证据的内容，进入详情后生成三类创意。所有输出为待验证草案。
                          </p>
                        </div>
                      </div>
                      <Cards rows={filtered} />
                    </>
                  ) : (
                    <>
                      <div className="section-head">
                        <h2>
                          {path === "/mechanics"
                            ? "传播机制案例库"
                            : path === "/local"
                              ? "真实生活，真实共鸣"
                              : current.label}
                          <span>{subset.length} SIGNALS</span>
                        </h2>
                        <button
                          className={`button small ${favorite ? "" : "subtle"}`}
                          onClick={() => setFavorite(!favorite)}
                        >
                          <Bookmark size={13} />
                          仅收藏
                        </button>
                      </div>
                      {path === "/creative" && (
                        <div className="tabs">
                          {["Short Videos", "Playable Ads"].map((t) => (
                            <button
                              key={t}
                              className={tab === t ? "active" : ""}
                              onClick={() => setTab(t)}
                            >
                              {t === "Short Videos"
                                ? "Viral Shorts"
                                : "Playable Ads"}
                            </button>
                          ))}
                        </div>
                      )}
                      {path === "/mechanics" && (
                        <div className="mechanism-grid">
                          {mechanisms.map((m) => (
                            <button
                              className={`mechanism-card ${mechanism === m ? "selected" : ""}`}
                              key={m}
                              onClick={() =>
                                setMechanism(mechanism === m ? "" : m)
                              }
                            >
                              <Zap size={17} />
                              <b>{m}</b>
                              <span>
                                {
                                  filtered.filter((t) =>
                                    t.mechanisms.includes(m),
                                  ).length
                                }{" "}
                                条已标记案例
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {path === "/local" && (
                        <section className="panel">
                          <h3>国家对比 · 不混算跨平台热度</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>来源市场</th>
                                <th>匹配内容</th>
                                <th>原始语言</th>
                                <th>来源平台</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(markets.length
                                ? markets
                                : countries.filter((c) => c !== "Global")
                              ).map((c) => (
                                <tr key={c}>
                                  <td>{c}</td>
                                  <td>
                                    {
                                      subset.filter((t) => t.country === c)
                                        .length
                                    }
                                  </td>
                                  <td>
                                    {[
                                      ...new Set(
                                        subset
                                          .filter((t) => t.country === c)
                                          .map((t) => t.language),
                                      ),
                                    ].join(", ") || "暂无证据"}
                                  </td>
                                  <td>
                                    {[
                                      ...new Set(
                                        subset
                                          .filter((t) => t.country === c)
                                          .map((t) => t.platform),
                                      ),
                                    ].join(", ") || "暂无证据"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </section>
                      )}
                      {path === "/local" && (
                        <div className="info-note">
                          PH 与 PK
                          的关键词仅为监控方向，不代表正在流行。国家对比保留各自来源与语言，不合并平台绝对指标。
                        </div>
                      )}
                      <Cards
                        rows={
                          path === "/mechanics"
                            ? filtered.filter((t) => t.mechanisms.length)
                            : subset
                        }
                      />
                    </>
                  )}
                </>
              )}
              {path === "/daily" &&
                (() => {
                  const days = [
                    ...new Set([
                      editionDay(),
                      ...ideas.map((i) => editionDay(i.createdAt)),
                      ...trends.map((t) => editionDay(t.collectedAt)),
                    ]),
                  ]
                    .sort()
                    .reverse();
                  const recommended = (i: Idea) =>
                    i.favorite ||
                    (i.rating ?? 0) >= 4 ||
                    i.status === "Approved";
                  const dayIdeas = ideas.filter(
                    (i) => editionDay(i.createdAt) === dailyDay,
                  );
                  const dayMemes = trends.filter(
                    (t) =>
                      t.type === "Meme" &&
                      editionDay(t.collectedAt) === dailyDay,
                  );
                  const rows = dayIdeas
                    .filter(
                      (i) =>
                        (!dailySearch ||
                          [
                            i.title,
                            i.content.pitch,
                            i.content.coreGameplay,
                            ...i.tags,
                          ]
                            .join(" ")
                            .toLowerCase()
                            .includes(dailySearch.toLowerCase())) &&
                        (!dailyRecommended || recommended(i)) &&
                        (!dailyDifficulty ||
                          i.content.productionComplexity?.includes(
                            dailyDifficulty,
                          )),
                    )
                    .sort(
                      (a, b) => Number(recommended(b)) - Number(recommended(a)),
                    );
                  const memes = dayMemes.filter(
                    (t) =>
                      !dailySearch ||
                      [t.title, t.summary, ...t.keywords]
                        .join(" ")
                        .toLowerCase()
                        .includes(dailySearch.toLowerCase()),
                  );
                  return (
                    <>
                      <section className="daily-header">
                        <div>
                          <span className="eyebrow">
                            MAKE SOMETHING WORTH PLAYING
                          </span>
                          <h2>
                            {dailyDay.replaceAll("-", ".")}{" "}
                            <span>· 每日选题</span>
                          </h2>
                          <p>先看值得做什么，再决定怎么做。按北京时间归档。</p>
                        </div>
                        <label>
                          历史日期
                          <select
                            value={dailyDay}
                            onChange={(e) => setDailyDay(e.target.value)}
                          >
                            {days.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                        </label>
                      </section>
                      <div className="daily-controls">
                        <div className="tabs">
                          <button
                            className={
                              dailyCategory === "ideas" ? "active" : ""
                            }
                            onClick={() => setDailyCategory("ideas")}
                          >
                            游戏选题 <b>{dayIdeas.length}</b>
                          </button>
                          <button
                            className={
                              dailyCategory === "memes" ? "active" : ""
                            }
                            onClick={() => setDailyCategory("memes")}
                          >
                            Meme <b>{dayMemes.length}</b>
                          </button>
                        </div>
                        <div className="inline">
                          <input
                            type="search"
                            aria-label="搜索每日选题"
                            placeholder="搜索选题、玩法、关键词…"
                            value={dailySearch}
                            onChange={(e) => setDailySearch(e.target.value)}
                          />
                          {dailyCategory === "ideas" && (
                            <>
                              <select
                                aria-label="每日选题制作难度"
                                value={dailyDifficulty}
                                onChange={(e) =>
                                  setDailyDifficulty(e.target.value)
                                }
                              >
                                <option value="">全部制作难度</option>
                                {["低", "中", "高"].map((d) => (
                                  <option key={d} value={d}>
                                    {d}难度
                                  </option>
                                ))}
                              </select>
                              <label className="inline">
                                <input
                                  type="checkbox"
                                  checked={dailyRecommended}
                                  onChange={(e) =>
                                    setDailyRecommended(e.target.checked)
                                  }
                                />
                                只看人工推荐
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="section-head">
                        <p className="muted" role="status">
                          {dailyCategory === "ideas"
                            ? rows.length
                            : memes.length}{" "}
                          条匹配内容 · 不是未经验证的“实时爆款榜”
                        </p>
                        <Export
                          kind={dailyCategory === "ideas" ? "ideas" : "memes"}
                          day={dailyDay}
                        />
                      </div>
                      {dailyCategory === "ideas" ? (
                        rows.length ? (
                          <div className="daily-entries">
                            {rows.map((i, index) => (
                              <details className="daily-entry" key={i.id}>
                                <summary>
                                  <span className="entry-number">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <span className="entry-main">
                                    <b>{i.title}</b>
                                    {recommended(i) && (
                                      <span className="chip selected">
                                        人工推荐
                                      </span>
                                    )}
                                    <span className="entry-pitch">
                                      {i.content.pitch}
                                    </span>
                                  </span>
                                  <span className="entry-difficulty">
                                    {i.content.productionComplexity?.match(
                                      /[低中高]/,
                                    )?.[0] ?? "待评估"}
                                    难度 <ChevronRight size={17} />
                                  </span>
                                </summary>
                                <div className="entry-expanded">
                                  <div className="tagline">
                                    <span>{i.trend.country}</span>
                                    <span>{i.direction}</span>
                                    <span>{i.status}</span>
                                  </div>
                                  <dl>
                                    {[
                                      ["选题理由", i.content.pitch],
                                      ["核心玩法", i.content.coreGameplay],
                                      ["广告钩子 · 前 3 秒", i.campaign.hook],
                                      [
                                        "失败 / 爽点",
                                        i.content.surpriseMoments,
                                      ],
                                      [
                                        "消费侧 / 创作者侧价值",
                                        i.content.evoMemeFit,
                                      ],
                                      [
                                        "制作复杂度（设计估计）",
                                        i.content.productionComplexity,
                                      ],
                                      [
                                        "文化与版权注意",
                                        i.content.culturalConsiderations,
                                      ],
                                      ["生成方式", i.content.generation],
                                    ].map(([k, v]) => (
                                      <div key={k}>
                                        <dt>{k}</dt>
                                        <dd>{v || "待补充"}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                  <p className="info-note">
                                    推荐标记来自人工收藏、评分至少 4 星或
                                    Approved 状态；不代表已验证的传播效果。
                                  </p>
                                  <div className="inline">
                                    <a
                                      className="button subtle small"
                                      href={i.trend.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      灵感原文 <ExternalLink size={13} />
                                    </a>
                                    <Link
                                      className="button subtle small"
                                      href={`/topics/${i.trend.id}`}
                                    >
                                      核对来源证据
                                    </Link>
                                    <button
                                      className="button subtle small"
                                      onClick={() =>
                                        run(
                                          "copy",
                                          () =>
                                            navigator.clipboard.writeText(
                                              i.prompt,
                                            ),
                                          "游戏 Prompt 已复制",
                                        )
                                      }
                                    >
                                      复制游戏 Prompt
                                    </button>
                                    <button
                                      className="button small"
                                      onClick={() => setSelectedIdea(i)}
                                    >
                                      编辑完整创意
                                    </button>
                                  </div>
                                </div>
                              </details>
                            ))}
                          </div>
                        ) : (
                          <Empty
                            title="这一天还没有符合条件的选题"
                            text="从真实热点生成创意，或清除筛选。新安装的资料库为空，不会补入对方站点内容或虚构选题。"
                            action={
                              <Link href="/lab" className="button">
                                从热点开始 <ArrowRight size={14} />
                              </Link>
                            }
                          />
                        )
                      ) : (
                        <Cards rows={memes} />
                      )}
                      {!trends.length && (
                        <section className="panel">
                          <h3>第一次使用：先获取真实信号</h3>
                          <p className="muted">
                            自动添加并尝试同步菲律宾、巴基斯坦 Google Trends
                            RSS。需要联网；成功与失败都会如实记录。
                          </p>
                          <button
                            className="button"
                            disabled={!!busy}
                            onClick={() =>
                              run(
                                "quick-sync",
                                async () => {
                                  try {
                                    for (const country of ["PH", "PK"]) {
                                      let source = sources.find(
                                        (s) =>
                                          s.kind === "google-trends" &&
                                          s.country === country,
                                      );
                                      if (!source)
                                        source = await request<Source>(
                                          "sources",
                                          {
                                            name: `${country} Google Trends`,
                                            kind: "google-trends",
                                            country,
                                            url: `https://trends.google.com/trending/rss?geo=${country}`,
                                          },
                                        );
                                      await request(
                                        `sources/${source.id}/sync`,
                                        {},
                                      );
                                    }
                                  } finally {
                                    await load();
                                  }
                                },
                                "已完成真实来源同步",
                              )
                            }
                          >
                            {busy === "quick-sync"
                              ? "正在同步…"
                              : "获取 PH / PK 热点"}
                          </button>
                        </section>
                      )}
                    </>
                  );
                })()}
              {path === "/library" && (
                <>
                  <div className="section-head">
                    <h2>
                      从灵感到发布<span>{ideas.length} IDEAS</span>
                    </h2>
                    <Export />
                  </div>
                  <div className="kanban">
                    {statuses.map((s) => (
                      <section className="kanban-column" key={s}>
                        <h3>
                          <span className="live-dot" />
                          {s}
                          <span>
                            {ideas.filter((i) => i.status === s).length}
                          </span>
                        </h3>
                        {ideas
                          .filter((i) => i.status === s)
                          .map((i) => (
                            <button
                              className="idea-card"
                              key={i.id}
                              onClick={() => setSelectedIdea(i)}
                            >
                              <span className="chip">{i.direction}</span>
                              <h4>{i.title}</h4>
                              <p>{i.content.pitch}</p>
                              <small>
                                {i.trend.country} ·{" "}
                                {i.favorite
                                  ? "★ 已收藏"
                                  : i.content.generation?.startsWith("AI")
                                    ? "AI 草案"
                                    : "规则草案"}{" "}
                                · {i.versions.length} 次修改
                              </small>
                            </button>
                          ))}
                      </section>
                    ))}
                  </div>
                  {!ideas.length && (
                    <Empty
                      title="创意库正在等待第一个想法"
                      text="从任何热点详情进入 Idea Lab，创意将保存于数据库，并支持版本记录与发布复盘。"
                      action={
                        <Link href="/lab" className="button">
                          打开 Idea Lab <ArrowRight size={14} />
                        </Link>
                      }
                    />
                  )}
                </>
              )}
              {path === "/watchlist" && (
                <>
                  <div className="panel">
                    <h2>关键词监控</h2>
                    <p className="muted">
                      匹配已采集的资料，不会冒充对外部平台的实时监测。可按国家分别建立观察清单。
                    </p>
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        run(
                          "watch",
                          () => request("watch", Object.fromEntries(f)),
                          "监控规则已创建",
                        );
                      }}
                    >
                      <input
                        name="keyword"
                        placeholder="例如：Exam Week / AI games"
                        required
                        maxLength={200}
                      />
                      <select name="country">
                        {countries.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <button className="button" disabled={!!busy}>
                        <Plus size={14} />
                        添加监控
                      </button>
                    </form>
                  </div>
                  {watches.map((w) => (
                    <section className="section" key={w.id}>
                      <div className="section-head">
                        <h2>
                          {w.keyword}
                          <span>{w.country}</span>
                        </h2>
                      </div>
                      <Cards
                        rows={trends.filter(
                          (t) =>
                            (w.country === "Global" ||
                              t.country === w.country) &&
                            [t.title, t.summary, ...t.keywords]
                              .join(" ")
                              .toLowerCase()
                              .includes(w.keyword.toLowerCase()),
                        )}
                      />
                    </section>
                  ))}
                </>
              )}
              {path === "/reports" && (
                <>
                  <div className="panel">
                    <div className="section-head">
                      <h2>情报报告与复盘</h2>
                      <div className="inline">
                        <a
                          className="button subtle small"
                          href="/api/export/trends?format=md&hours=24"
                        >
                          24h 日报
                        </a>
                        <a
                          className="button subtle small"
                          href="/api/export/trends?format=md&hours=168"
                        >
                          7d 周报
                        </a>
                        <Export kind="trends" />
                      </div>
                    </div>
                    <p>
                      导出当前资料库的真实来源、评分、数据缺口及完整创意。时区为北京时间。CSV
                      中的公式前缀已转义。
                    </p>
                    <div className="stats">
                      <div className="stat">
                        <span>资料记录</span>
                        <strong>{trends.length}</strong>
                      </div>
                      <div className="stat">
                        <span>进入制作</span>
                        <strong>
                          {
                            ideas.filter((i) => i.status === "In Production")
                              .length
                          }
                        </strong>
                      </div>
                      <div className="stat">
                        <span>已发布</span>
                        <strong>
                          {ideas.filter((i) => i.status === "Published").length}
                        </strong>
                      </div>
                      <div className="stat">
                        <span>有人工复盘记录</span>
                        <strong>
                          {ideas.filter((i) => i.outcomes).length}
                        </strong>
                      </div>
                    </div>
                    <p className="info-note">
                      当前提供全量情报导出与人工发布效果记录；自动周报、定时采集与归因分析尚未启用。没有经过验证的数据，不宣称带来新增。
                    </p>
                  </div>
                  {ideas
                    .filter((i) => i.outcomes)
                    .map((i) => (
                      <section className="panel" key={i.id}>
                        <h3>{i.title}</h3>
                        <dl>
                          {Object.entries(i.outcomes ?? {}).map(([k, v]) => (
                            <div key={k}>
                              <dt>{k}</dt>
                              <dd>{String(v)}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ))}
                </>
              )}
              {path === "/sources" && (
                <>
                  <div className="section-head">
                    <h2>
                      Source Registry<span>{sources.length} CONNECTORS</span>
                    </h2>
                    <button
                      className="button"
                      onClick={() => setModal("source")}
                    >
                      <Plus size={14} />
                      添加来源
                    </button>
                  </div>
                  <div className="info-note">
                    支持 Google Trends RSS、公开 RSS、YouTube Data API 与手动
                    URL / JSON / CSV
                    导入。来源可用性以实际同步结果为准。付费广告情报可通过授权文件导入。
                  </div>
                  {sources.length ? (
                    <div className="source-grid">
                      {sources.map((s) => (
                        <section className="panel" key={s.id}>
                          <div className="section-head">
                            <h3>{s.name}</h3>
                            <span
                              className={`status-tag ${s.error ? "failed" : ""}`}
                            >
                              {s.error
                                ? "同步失败"
                                : s.lastSuccess
                                  ? "已连接"
                                  : "待测试"}
                            </span>
                          </div>
                          <div className="tagline">
                            <span>{s.kind}</span>
                            <span>{s.country}</span>
                            <span>{s.enabled ? "启用" : "停用"}</span>
                          </div>
                          <p className="muted break">{s.url}</p>
                          <small>最近成功：{when(s.lastSuccess)}</small>
                          {s.error && <p className="error-text">{s.error}</p>}
                          <div className="inline spaced">
                            <button
                              className="button small"
                              disabled={!!busy || !s.enabled}
                              onClick={() =>
                                run(
                                  s.id,
                                  () => request(`sources/${s.id}/sync`, {}),
                                  "来源同步完成",
                                )
                              }
                            >
                              <RefreshCw size={13} />
                              {busy === s.id ? "同步中…" : "测试并同步"}
                            </button>
                            <button
                              className="button subtle small"
                              disabled={!!busy}
                              onClick={() =>
                                run("toggle", () =>
                                  request(`sources/${s.id}`, {
                                    enabled: !s.enabled,
                                  }),
                                )
                              }
                            >
                              {s.enabled ? "停用" : "启用"}
                            </button>
                          </div>
                          <details>
                            <summary>同步日志 · 最近 8 次</summary>
                            {s.logs.map((l) => (
                              <p className="log" key={l.id}>
                                {when(l.createdAt)} · {l.status} · {l.count} 条{" "}
                                {l.message}
                              </p>
                            ))}
                          </details>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="尚未连接数据源"
                      action={
                        <button
                          className="button"
                          onClick={() => setModal("source")}
                        >
                          添加第一个来源
                        </button>
                      }
                    />
                  )}
                  <div className="detail-columns">
                    <section className="panel">
                      <h2>服务配置</h2>
                      <details>
                        <summary>生活场景分类管理</summary>
                        <p>内置分类保留，可新增和编辑扩展分类，每行一项。</p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            run("scenes", () =>
                              request("settings/scenes", {
                                scenes: String(f.get("scenes"))
                                  .split("\n")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }),
                            );
                          }}
                        >
                          <textarea
                            name="scenes"
                            rows={4}
                            defaultValue={config.scenes.join("\n")}
                          />
                          <button className="button small" disabled={!!busy}>
                            保存扩展分类
                          </button>
                        </form>
                      </details>
                      <dl>
                        <div>
                          <dt>YouTube Data API</dt>
                          <dd>
                            {config.youtube
                              ? "密钥已注入"
                              : "未配置 YOUTUBE_API_KEY"}
                          </dd>
                        </div>
                        <div>
                          <dt>OpenAI</dt>
                          <dd>
                            {config.ai
                              ? "已配置 · " + config.model
                              : "未配置 OPENAI_API_KEY"}
                          </dd>
                        </div>
                        <div>
                          <dt>数据库</dt>
                          <dd>PostgreSQL · Prisma</dd>
                        </div>
                        <div>
                          <dt>评分规则</dt>
                          <dd>{config.scoreVersion}</dd>
                        </div>
                      </dl>
                      <p className="info-note">
                        密钥仅通过服务器环境变量配置，不在网页录入或返回。缺失密钥不影响其他功能。生产环境须放在受保护的网络或认证网关后。
                      </p>
                    </section>
                    <section className="panel">
                      <h2>可配置推荐权重</h2>
                      <p className="muted">
                        初始值是假设，不是经过验证的预测模型。机会分数额外乘以证据质量系数。
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          run("weights", () =>
                            request("settings", { weights }),
                          );
                        }}
                      >
                        {(Object.keys(weights) as (keyof Weights)[]).map(
                          (k) => (
                            <label key={k} className="weight-label">
                              {k}
                              <input
                                type="number"
                                min={0}
                                max={100}
                                required
                                value={weights[k]}
                                onChange={(e) =>
                                  setWeights({
                                    ...weights,
                                    [k]: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                          ),
                        )}
                        <button className="button small" disabled={!!busy}>
                          保存评分规则
                        </button>
                      </form>
                    </section>
                  </div>
                </>
              )}
            </>
          )}
          <footer>
            EVOMEME TREND RADAR{" "}
            <span>Evidence before assumptions. Creativity beyond trends.</span>
            <small>时间：Asia/Shanghai · 内部工作台</small>
          </footer>
        </div>
      </main>
      {modal && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "source"
                ? "添加数据源"
                : modal === "analysis"
                  ? "人工分析"
                  : "导入真实资料"
            }
          >
            <button
              className="close icon"
              onClick={() => setModal("")}
              aria-label="关闭窗口"
            >
              <X />
            </button>
            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}
            {modal === "import" ? (
              <>
                <div className="eyebrow">ADD REAL SIGNALS</div>
                <h2>导入真实资料</h2>
                <div className="tabs">
                  {[
                    ["json", "JSON"],
                    ["csv", "CSV"],
                    ["manual", "手动 URL"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      className={format === v ? "active" : ""}
                      onClick={() => setFormat(v)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {format === "manual" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = Object.fromEntries(
                        new FormData(e.currentTarget),
                      );
                      run(
                        "import",
                        async () => {
                          await request("import", { records: [data] });
                          setModal("");
                        },
                        "资料已导入",
                      );
                    }}
                  >
                    <div className="form-grid">
                      <label>
                        标题
                        <input name="title" required />
                      </label>
                      <label>
                        原始链接
                        <input name="url" type="url" required />
                      </label>
                      <label>
                        来源平台
                        <input
                          name="platform"
                          required
                          placeholder="如 Reddit / 授权广告资料"
                        />
                      </label>
                      <label>
                        国家 / 来源市场
                        <select name="country">
                          {countries.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        原始语言
                        <input
                          name="language"
                          required
                          placeholder="如 English / Roman Urdu / unknown"
                        />
                      </label>
                      <label>
                        内容类型
                        <select name="type">
                          {types.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      原始文字 / 人工摘要
                      <textarea name="summary" rows={4} />
                    </label>
                    <p className="info-note">
                      仅保存链接与输入资料，不自动读取网页或视频，也不推测热度。
                    </p>
                    <button className="button" disabled={!!busy}>
                      保存资料
                    </button>
                  </form>
                ) : (
                  <>
                    <p className="muted">
                      必需字段：title, url, platform, country, language,
                      type。可选 keywords、mechanisms、snapshots。国家填 PH / PK
                      等代码；指标必须有观察时间与来源。
                    </p>
                    <input
                      aria-label="选择导入文件"
                      type="file"
                      accept=".json,.csv"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 3_000_000) {
                            setError("文件超过 3MB");
                            return;
                          }
                          setImportText(await file.text());
                        }
                      }}
                    />
                    <textarea
                      aria-label="导入内容"
                      rows={10}
                      value={importText}
                      placeholder={
                        format === "json"
                          ? "粘贴真实资料 JSON 数组，或选择文件"
                          : "title,url,platform,country,language,type,summary"
                      }
                      onChange={(e) => setImportText(e.target.value)}
                    />
                    <details>
                      <summary>JSON 格式说明</summary>
                      <pre>
                        {JSON.stringify(
                          [
                            {
                              title: "填写真实内容标题",
                              url: "https://example.com/your-source",
                              platform: "News / RSS",
                              country: "PH",
                              language: "English",
                              type: "Local Life",
                              keywords: ["keyword"],
                              snapshots: [
                                {
                                  metric: "views",
                                  value: 123,
                                  capturedAt: "2026-10-27T00:00:00Z",
                                  provenance: "填写真实指标出处",
                                },
                              ],
                            },
                          ],
                          null,
                          2,
                        )}
                      </pre>
                      <p>
                        此处仅为格式示例，请替换为已核实资料，不会自动写入数据库。
                      </p>
                    </details>
                    <button
                      className="button"
                      disabled={!!busy || !importText.trim()}
                      onClick={() =>
                        run(
                          "import",
                          async () => {
                            let records;
                            if (format === "csv") {
                              const parsed = Papa.parse<Record<string, string>>(
                                importText,
                                { header: true, skipEmptyLines: true },
                              );
                              if (parsed.errors.length)
                                throw new Error(parsed.errors[0].message);
                              records = parsed.data.map((r) => ({
                                ...r,
                                ...Object.fromEntries(
                                  [
                                    "keywords",
                                    "mechanisms",
                                    "emotions",
                                    "snapshots",
                                  ]
                                    .filter((k) => r[k])
                                    .map((k) => [k, JSON.parse(r[k])]),
                                ),
                              }));
                            } else records = JSON.parse(importText);
                            const result = await request<{ count: number }>(
                              "import",
                              { records },
                            );
                            setModal("");
                            setNotice(`已导入 ${result.count} 条记录`);
                          },
                          "导入完成",
                        )
                      }
                    >
                      验证并导入
                    </button>
                  </>
                )}
              </>
            ) : modal === "source" ? (
              <>
                <div className="eyebrow">CONNECT A SOURCE</div>
                <h2>添加数据源</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = Object.fromEntries(
                      new FormData(e.currentTarget),
                    );
                    run(
                      "source",
                      async () => {
                        await request("sources", data);
                        setModal("");
                      },
                      "来源已添加，请测试并同步",
                    );
                  }}
                >
                  <label>
                    来源名称
                    <input
                      name="name"
                      required
                      placeholder="例如 PH Google Trends"
                    />
                  </label>
                  <label>
                    连接器
                    <select name="kind">
                      <option value="google-trends">Google Trends RSS</option>
                      <option value="rss">公开 RSS</option>
                      <option value="youtube">YouTube Data API</option>
                    </select>
                  </label>
                  <label>
                    来源地址
                    <input
                      name="url"
                      type="url"
                      defaultValue="https://trends.google.com/trending/rss?geo=PH"
                      required
                    />
                  </label>
                  <label>
                    国家 / 来源市场
                    <input
                      name="country"
                      defaultValue="PH"
                      pattern="Global|[A-Z]{2}"
                      required
                    />
                  </label>
                  <p className="info-note">
                    RSS
                    允许域名：trends.google.com、news.google.com、feeds.bbci.co.uk、www.theguardian.com、feeds.arstechnica.com、www.gamespot.com、www.pcgamer.com。YouTube
                    拉取地区游戏分类热门视频，不会自动将普通视频标记为 Shorts。
                  </p>
                  <button className="button" disabled={!!busy}>
                    添加来源
                  </button>
                </form>
              </>
            ) : modal === "history" ? (
              <>
                <h2>评分历史与规则版本</h2>
                <p>
                  每次导入、AI
                  分析或权重变更记录评分。当时的主观分析与权重可追溯。
                </p>
                {scoreHistory.length ? (
                  scoreHistory.map((r, i) => (
                    <pre key={i}>{JSON.stringify(r, null, 2)}</pre>
                  ))
                ) : (
                  <p>尚无评分历史。</p>
                )}
              </>
            ) : modal === "details" ? (
              <>
                <h2>结构化游戏 / 素材档案</h2>
                <p>
                  只录入可验证的信息；无法确认的字段保留
                  null。普通视频广告不能标为真正可试玩。
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run("details", async () => {
                      await request(`trends/${trendId}`, {
                        details: JSON.parse(String(f.get("details"))),
                      });
                      setModal("");
                    });
                  }}
                >
                  <textarea
                    name="details"
                    rows={22}
                    defaultValue={JSON.stringify(
                      trend?.details ??
                        (trend?.type === "Playable Ads"
                          ? {
                              advertiser: null,
                              firstObserved: null,
                              lastObserved: null,
                              assetType: null,
                              isActuallyPlayable: null,
                              previewUrl: null,
                              gameplay: null,
                              hook: null,
                              failureAndReward: null,
                              visualStyle: null,
                              cta: null,
                              reusableIdeas: null,
                              evidenceNotes: null,
                            }
                          : trend?.type === "Short Videos"
                            ? {
                                creator: null,
                                publishedAt: null,
                                durationSeconds: null,
                                thumbnailUrl: null,
                                accessibleContentSummary: null,
                                firstThreeSecondsHook: null,
                                visualStimulus: null,
                                conflict: null,
                                reversal: null,
                                reward: null,
                                sharingMotivation: null,
                                cta: null,
                                evidenceNotes: null,
                              }
                            : {
                                genre: null,
                                visualStyle: null,
                                coreGameplay: null,
                                controls: null,
                                gameLoop: null,
                                failureMechanic: null,
                                rewardFeedback: null,
                                sessionLength: null,
                                sessionLengthEstimated: true,
                                mobileFriendly: null,
                                shortVideoFit: null,
                                sharingMechanic: null,
                                remixPotential: null,
                                complexity: null,
                                referenceIdeas: null,
                                publicRank: null,
                                rankEvidence: null,
                              }),
                      null,
                      2,
                    )}
                  />
                  <button className="button" disabled={!!busy}>
                    保存素材档案
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>人工分析 · 明确记录证据</h2>
                <p>
                  以 JSON 保存结构化分析。所有字段须填写；无法确认的镜头信息填
                  null，主观评分不等于客观热度。
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run("analysis", async () => {
                      await request(`trends/${trendId}`, {
                        analysis: JSON.parse(String(f.get("analysis"))),
                      });
                      setModal("");
                    });
                  }}
                >
                  <textarea
                    name="analysis"
                    rows={20}
                    defaultValue={JSON.stringify(
                      trend?.analysis
                        ? Object.fromEntries(
                            Object.entries(trend.analysis).filter(
                              ([k]) =>
                                ![
                                  "model",
                                  "basis",
                                  "promptVersion",
                                  "createdAt",
                                ].includes(k),
                            ),
                          )
                        : {
                            translation: "",
                            literalMeaning: "待核实",
                            culturalContext: "待核实",
                            sensitivity: "待审核",
                            observations: [],
                            inferences: [],
                            suggestions: [],
                            mechanisms: [],
                            hook: null,
                            stop: "待分析",
                            watch: "待分析",
                            interact: "待分析",
                            share: "待分析",
                            retry: "待分析",
                            identity: "待核实",
                            emotionCurve: "待分析",
                            visualFeedback: null,
                            gameplay: "待分析",
                            videoStructure: null,
                            scores: { local: 0, playable: 0, viral: 0 },
                          },
                      null,
                      2,
                    )}
                  />
                  <button className="button" disabled={!!busy}>
                    保存人工分析
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
      {selectedIdea && (
        <div className="modal-backdrop">
          <section
            className="modal wide"
            role="dialog"
            aria-modal="true"
            aria-label="编辑创意"
          >
            <button
              className="close icon"
              onClick={() => setSelectedIdea(null)}
              aria-label="关闭创意"
            >
              <X />
            </button>
            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}
            <div className="eyebrow">{selectedIdea.direction} / DRAFT</div>
            <h2>{selectedIdea.title}</h2>
            <p className="info-note">
              创意草案，未经市场验证。灵感与证据：
              <a href={selectedIdea.trend.url} target="_blank" rel="noreferrer">
                {selectedIdea.trend.originalTitle} <ExternalLink size={12} />
              </a>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const campaign = { ...selectedIdea.campaign };
                for (const k of Object.keys(campaign))
                  campaign[k] = String(f.get("campaign." + k));
                const content = { ...selectedIdea.content };
                for (const k of Object.keys(content))
                  content[k] = String(f.get("content." + k));
                const outcomes: Record<string, string | number> = {};
                for (const k of [
                  "gameUrl",
                  "videoUrl",
                  "country",
                  "contentType",
                  "notes",
                ])
                  outcomes[k] = String(f.get(k) ?? "");
                for (const k of [
                  "views",
                  "clicks",
                  "plays",
                  "shares",
                  "acquisitions",
                ])
                  if (f.get(k) !== "") outcomes[k] = Number(f.get(k));
                run(
                  "save-idea",
                  async () => {
                    await request(`ideas/${selectedIdea.id}`, {
                      title: String(f.get("title")),
                      status: String(f.get("status")),
                      favorite: f.get("favorite") === "on",
                      rating:
                        f.get("rating") === "" ? null : Number(f.get("rating")),
                      tags: String(f.get("tags"))
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                      prompt: String(f.get("prompt")),
                      content,
                      campaign,
                      ...(Object.values(outcomes).some((v) => v !== "")
                        ? { outcomes }
                        : {}),
                    });
                    setSelectedIdea(null);
                  },
                  "创意已保存，旧版本已归档",
                );
              }}
            >
              <div className="form-grid">
                <label>
                  创意标题
                  <input
                    name="title"
                    defaultValue={selectedIdea.title}
                    required
                  />
                </label>
                <label>
                  工作流状态
                  <select name="status" defaultValue={selectedIdea.status}>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  评分 0–5
                  <input
                    name="rating"
                    type="number"
                    min={0}
                    max={5}
                    defaultValue={selectedIdea.rating ?? ""}
                  />
                </label>
                <label>
                  标签（英文逗号分隔）
                  <input
                    name="tags"
                    defaultValue={selectedIdea.tags.join(", ")}
                  />
                </label>
              </div>
              <label className="inline">
                <input
                  type="checkbox"
                  name="favorite"
                  defaultChecked={selectedIdea.favorite}
                />
                收藏创意
              </label>
              <details open>
                <summary>完整游戏设计 · 22 项</summary>
                <div className="form-grid">
                  {Object.entries(selectedIdea.content).map(([k, v]) => (
                    <label key={k}>
                      {labels[k] ?? k}
                      <textarea
                        name={"content." + k}
                        defaultValue={v}
                        rows={3}
                      />
                    </label>
                  ))}
                </div>
              </details>
              <div className="section-head">
                <h3>英文游戏 Prompt</h3>
                <button
                  type="button"
                  className="button subtle small"
                  onClick={() =>
                    run(
                      "copy",
                      () => navigator.clipboard.writeText(selectedIdea.prompt),
                      "Prompt 已复制",
                    )
                  }
                >
                  复制 Prompt
                </button>
              </div>
              <textarea
                name="prompt"
                defaultValue={selectedIdea.prompt}
                rows={10}
              />
              <details>
                <summary>宣传内容与 Remix Challenge</summary>
                <dl>
                  {Object.entries(selectedIdea.campaign).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>
                        <textarea
                          name={"campaign." + k}
                          defaultValue={v}
                          rows={3}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
              <details>
                <summary>发布结果 · 人工录入，非自动归因</summary>
                <div className="form-grid">
                  {[
                    ["gameUrl", "游戏链接"],
                    ["videoUrl", "视频链接"],
                    ["country", "发布国家"],
                    ["contentType", "内容形式"],
                    ["views", "播放量"],
                    ["clicks", "点击量"],
                    ["plays", "试玩量"],
                    ["shares", "分享量"],
                    ["acquisitions", "有效新增（需自行核验）"],
                    ["notes", "验证说明 / 其他数据"],
                  ].map(([k, l]) => (
                    <label key={k}>
                      {l}
                      <input
                        name={k}
                        type={
                          [
                            "views",
                            "clicks",
                            "plays",
                            "shares",
                            "acquisitions",
                          ].includes(k)
                            ? "number"
                            : "text"
                        }
                        min={0}
                        defaultValue={selectedIdea.outcomes?.[k] ?? ""}
                      />
                    </label>
                  ))}
                </div>
              </details>
              <details>
                <summary>历史版本 · {selectedIdea.versions.length}</summary>
                {selectedIdea.versions.map((v) => (
                  <details key={v.id}>
                    <summary>{when(v.createdAt)}</summary>
                    <pre>{JSON.stringify(v.data, null, 2)}</pre>
                  </details>
                ))}
              </details>
              <button className="button" disabled={!!busy}>
                保存创意及版本
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
