import { z } from "zod";
import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { db } from "./db";
import { recordScores } from "./scoring";
import { types } from "./domain";
export const publicUrl = z
  .string()
  .url()
  .max(2000)
  .refine((v) => {
    const u = new URL(v);
    return (
      ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
    );
  }, "仅支持不含凭据的 HTTP(S) 链接");
const metric = z.object({
  metric: z.string().min(1).max(80),
  value: z.number().finite().nonnegative(),
  capturedAt: z.iso.datetime(),
  provenance: z.string().min(1).max(300),
});
export const recordSchema = z.object({
  sourceKey: z.string().max(500).optional(),
  details: z
    .record(
      z.string(),
      z.union([
        z.string().max(20000),
        z.number().finite(),
        z.boolean(),
        z.null(),
      ]),
    )
    .optional(),
  title: z.string().min(1).max(500),
  originalTitle: z.string().max(500).optional(),
  summary: z.string().max(12000).default(""),
  url: publicUrl,
  platform: z.string().min(1).max(100),
  country: z.string().regex(/^(Global|[A-Z]{2})$/),
  language: z.string().min(1).max(80),
  type: z.enum(types as [string, ...string[]]),
  scene: z.string().max(100).default(""),
  keywords: z.array(z.string().max(100)).max(50).default([]),
  mechanisms: z.array(z.string().max(100)).max(30).default([]),
  emotions: z.array(z.string().max(100)).max(30).default([]),
  publishedAt: z.iso.datetime().optional(),
  snapshots: z.array(metric).max(1000).default([]),
});
export type ImportRecord = z.input<typeof recordSchema>;
export async function importRecords(raw: unknown) {
  const rows = z.array(recordSchema).min(1).max(500).parse(raw);
  const count = await db.$transaction(
    async (tx) => {
      let count = 0;
      for (const row of rows) {
        const { snapshots, sourceKey, ...data } = row;
        const identity = createHash("sha256")
          .update([row.platform, row.country, sourceKey ?? row.url].join("|"))
          .digest("hex");
        const trend = await tx.trend.upsert({
          where: { identity },
          create: {
            ...data,
            identity,
            originalTitle: row.originalTitle ?? row.title,
          },
          update: {
            ...data,
            originalTitle: row.originalTitle ?? row.title,
            collectedAt: new Date(),
          },
        });
        for (const s of snapshots)
          await tx.snapshot.upsert({
            where: {
              trendId_metric_capturedAt: {
                trendId: trend.id,
                metric: s.metric,
                capturedAt: new Date(s.capturedAt),
              },
            },
            create: { ...s, trendId: trend.id },
            update: { value: s.value, provenance: s.provenance },
          });
        count++;
      }
      return count;
    },
    { timeout: 30000 },
  );
  await recordScores();
  return count;
}
const hosts = new Set([
  "trends.google.com",
  "news.google.com",
  "feeds.bbci.co.uk",
  "www.theguardian.com",
  "feeds.arstechnica.com",
  "www.gamespot.com",
  "www.pcgamer.com",
]);
export async function fetchFeed(url: string) {
  const u = new URL(url);
  if (
    u.protocol !== "https:" ||
    !hosts.has(u.hostname) ||
    u.port ||
    u.username ||
    u.password
  )
    throw new Error(
      "RSS 仅允许预批准的 HTTPS 来源域名；新来源需由管理员配置连接器。",
    );
  const res = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "EvoMemeRadar/0.1 (RSS reader)" },
  });
  if (!res.ok) throw new Error(`来源响应 HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > 3_000_000) throw new Error("来源内容超过 3MB 限制");
  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: true,
  }).parse(text);
  if (!parsed.rss?.channel && !parsed.feed)
    throw new Error("来源没有返回可解析的 RSS / Atom 文档");
  return parsed;
}
export async function syncSource(id: string) {
  const source = await db.source.findUniqueOrThrow({ where: { id } });
  if (!source.enabled) throw new Error("来源已停用");
  try {
    let rows: ImportRecord[] = [];
    if (source.kind === "youtube") {
      if (!process.env.YOUTUBE_API_KEY)
        throw new Error("尚未配置 YOUTUBE_API_KEY");
      const query = new URLSearchParams({
        part: "snippet,statistics",
        chart: "mostPopular",
        videoCategoryId: "20",
        regionCode: source.country === "Global" ? "US" : source.country,
        maxResults: "50",
        key: process.env.YOUTUBE_API_KEY,
      });
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${query}`,
        { signal: AbortSignal.timeout(20000) },
      );
      if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
      const data = await res.json();
      rows = (data.items ?? []).map(
        (v: {
          id: string;
          snippet: {
            title: string;
            description: string;
            publishedAt: string;
            defaultLanguage?: string;
          };
          statistics: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
          };
        }) => ({
          title: v.snippet.title,
          summary: v.snippet.description,
          url: `https://www.youtube.com/watch?v=${v.id}`,
          platform: "YouTube",
          country: source.country,
          language: v.snippet.defaultLanguage ?? "unknown",
          type: "Gaming",
          publishedAt: v.snippet.publishedAt,
          snapshots: Object.entries(v.statistics)
            .filter(([k]) =>
              ["viewCount", "likeCount", "commentCount"].includes(k),
            )
            .map(([metric, value]) => ({
              metric,
              value: Number(value),
              capturedAt: new Date().toISOString(),
              provenance: `YouTube Data API: mostPopular region=${source.country}`,
            })),
        }),
      );
    } else {
      const feed = await fetchFeed(source.url);
      const items = feed.rss?.channel?.item ?? feed.feed?.entry ?? [];
      rows = (Array.isArray(items) ? items : [items])
        .slice(0, 100)
        .map((item: Record<string, unknown>) => {
          const str = (v: unknown): string =>
            typeof v === "string"
              ? v
              : typeof v === "number"
                ? String(v)
                : v && typeof v === "object"
                  ? String((v as Record<string, unknown>)["#text"] ?? "")
                  : "";
          const link =
            typeof item.link === "object" && item.link
              ? str((item.link as Record<string, unknown>)["@_href"])
              : str(item.link);
          const rawNews = item["ht:news_item"];
          const news = (
            Array.isArray(rawNews) ? rawNews : rawNews ? [rawNews] : []
          ) as Record<string, unknown>[];
          const details =
            source.kind === "google-trends"
              ? {
                  sourceFeed: source.url,
                  relatedEvidence: JSON.stringify(
                    news.map((n) => ({
                      title: str(n["ht:news_item_title"]),
                      url: str(n["ht:news_item_url"]),
                      source: str(n["ht:news_item_source"]),
                    })),
                  ),
                  metricCaveat:
                    "搜索量为来源给出的近似下界，非精确搜索量，不用于计算增长率。",
                }
              : undefined;
          const date = str(item.pubDate ?? item.published);
          const traffic = str(item["ht:approx_traffic"]);
          const numeric =
            Number(traffic.replace(/[^0-9.]/g, "")) *
            (traffic.includes("M")
              ? 1000000
              : traffic.includes("K")
                ? 1000
                : 1);
          return {
            ...(source.kind === "google-trends"
              ? {
                  sourceKey: str(item.title),
                  keywords: [str(item.title)],
                  details,
                }
              : {}),
            title: str(item.title),
            summary: str(item.description ?? item.summary)
              .replace(/<[^>]*>/g, " ")
              .slice(0, 12000),
            url: link,
            platform:
              source.kind === "google-trends" ? "Google Trends" : "News / RSS",
            country: source.country,
            language: "unknown",
            type: "Entertainment",
            ...(date && !isNaN(Date.parse(date))
              ? { publishedAt: new Date(date).toISOString() }
              : {}),
            snapshots:
              traffic && Number.isFinite(numeric)
                ? [
                    {
                      metric: "approx_searches_lower_bound",
                      value: numeric,
                      capturedAt: new Date().toISOString(),
                      provenance:
                        "Google Trends RSS approximate traffic; lower bound, not exact searches",
                    },
                  ]
                : [],
          };
        })
        .filter(
          (r: ImportRecord) => publicUrl.safeParse(r.url).success && r.title,
        );
    }
    const count = rows.length ? await importRecords(rows) : 0;
    await db.source.update({
      where: { id },
      data: { lastSuccess: new Date(), error: null },
    });
    await db.syncLog.create({
      data: { sourceId: id, status: "success", count },
    });
    return { count };
  } catch (e) {
    const message = e instanceof Error ? e.message : "同步失败";
    await db.source.update({
      where: { id },
      data: { lastFailure: new Date(), error: message },
    });
    await db.syncLog.create({
      data: { sourceId: id, status: "failed", message },
    });
    throw new Error(message);
  }
}
