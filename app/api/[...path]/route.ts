import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Papa from "papaparse";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordScores } from "@/lib/scoring";
import {
  score,
  defaultWeights,
  statuses,
  cluster,
  editionDay,
} from "@/lib/domain";
import { importRecords, syncSource, publicUrl } from "@/lib/ingest";
import { analyze, generateIdeas, analysisSchema } from "@/lib/creative";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const json = (v: unknown) => NextResponse.json(v);
async function list() {
  const trends = await db.trend.findMany({
    include: {
      snapshots: { orderBy: { capturedAt: "asc" } },
      _count: { select: { ideas: true } },
    },
    orderBy: { collectedAt: "desc" },
  });
  const weights = (await db.setting.findUnique({ where: { key: "weights" } }))
    ?.value as typeof defaultWeights | null;
  return trends.map((t) => ({
    ...t,
    score: score(t, trends, weights ?? defaultWeights),
  }));
}
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const p = (await params).path;
    if (p[0] === "trends") {
      const rows = await list();
      if (p[1]) return json(rows.find((t) => t.id === p[1]) ?? null);
      return json(rows);
    }
    if (p[0] === "sources")
      return json(
        await db.source.findMany({
          include: { logs: { take: 8, orderBy: { createdAt: "desc" } } },
          orderBy: { createdAt: "asc" },
        }),
      );
    if (p[0] === "ideas")
      return json(
        await db.idea.findMany({
          include: {
            trend: true,
            versions: { orderBy: { createdAt: "desc" } },
          },
          orderBy: { updatedAt: "desc" },
        }),
      );
    if (p[0] === "watch")
      return json(await db.watch.findMany({ orderBy: { createdAt: "desc" } }));
    if (p[0] === "settings")
      return json({
        weights:
          (await db.setting.findUnique({ where: { key: "weights" } }))?.value ??
          defaultWeights,
        youtube: !!process.env.YOUTUBE_API_KEY,
        ai: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        scoreVersion: "scores-v1",
        scenes:
          (await db.setting.findUnique({ where: { key: "scenes" } }))?.value ??
          [],
      });
    if (p[0] === "scores" && p[1])
      return json(
        await db.scoreRecord.findMany({
          where: { trendId: p[1] },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      );
    if (p[0] === "health") {
      await db.$queryRaw`SELECT 1`;
      return json({ database: "ok", version: "0.1.0" });
    }
    if (p[0] === "clusters")
      return json(
        cluster(await db.trend.findMany()).map((g) => ({
          keywords: [...new Set(g.flatMap((t) => t.keywords))],
          trends: g.map((t) => ({ id: t.id, title: t.title })),
        })),
      );
    if (p[0] === "export") {
      let rows =
        p[1] === "ideas"
          ? await db.idea.findMany({ include: { trend: true } })
          : await list();
      if (p[1] === "memes")
        rows = rows.filter(
          (r) => "type" in r && r.type === "Meme",
        ) as typeof rows;
      const hours = Number(req.nextUrl.searchParams.get("hours"));
      if (hours > 0 && hours <= 8760)
        rows = rows.filter(
          (r) =>
            Date.now() -
              +new Date("collectedAt" in r ? r.collectedAt : r.createdAt) <
            hours * 3600000,
        ) as typeof rows;
      const day = req.nextUrl.searchParams.get("day");
      if (day)
        rows = rows.filter(
          (r) =>
            editionDay("collectedAt" in r ? r.collectedAt : r.createdAt) ===
            day,
        ) as typeof rows;
      const format = req.nextUrl.searchParams.get("format") ?? "json";
      const flat = rows.map((r) => JSON.parse(JSON.stringify(r)));
      let content: string, mime: string;
      if (format === "csv") {
        content = Papa.unparse(
          flat.map((r) =>
            Object.fromEntries(
              Object.entries(r).map(([k, v]) => [
                k,
                typeof v === "object"
                  ? JSON.stringify(v)
                  : typeof v === "string" && /^\s*[=+\-@\t\r]/.test(v)
                    ? "'" + v
                    : v,
              ]),
            ),
          ),
        );
        mime = "text/csv; charset=utf-8";
      } else if (format === "md") {
        content =
          `# EvoMeme ${p[1] === "ideas" ? "创意库" : "热点日报"}\n\n生成时间：${new Date().toISOString()}\n\n` +
          flat
            .map(
              (r) =>
                `## ${r.title}\n\n${r.url ? `来源：${r.url}\n国家：${r.country}（来源市场，非已验证传播地区）\n采集：${r.collectedAt}\n语言：${r.language}\n状态：${r.score.state}\n可信度：${r.score.confidence}\n热度：${r.score.heat ?? "样本不足"}\n\n${r.summary}` : `状态：${r.status}\n灵感来源：${r.trend.url}\n\n${JSON.stringify(r.content, null, 2)}\n\n### Game Prompt\n${r.prompt}\n\n### 宣传内容\n${JSON.stringify(r.campaign, null, 2)}`}`,
            )
            .join("\n\n---\n\n");
        mime = "text/markdown; charset=utf-8";
      } else {
        content = JSON.stringify(rows, null, 2);
        mime = "application/json";
      }
      return new NextResponse(content, {
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `attachment; filename="evomeme-${p[1]}.${format}"`,
        },
      });
    }
    return json({ error: "接口不存在" });
  } catch (e) {
    console.error("GET failed", e instanceof Error ? e.name : "Error");
    return NextResponse.json(
      { error: "数据库暂不可用，请检查 PostgreSQL 是否已启动" },
      { status: 503 },
    );
  }
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host"))
      return NextResponse.json({ error: "不允许跨站写入" }, { status: 403 });
    if (Number(req.headers.get("content-length") ?? 0) > 3_000_000)
      throw new Error("请求超过 3MB 限制");
    const p = (await params).path;
    const text = await req.text();
    if (text.length > 3_000_000) throw new Error("请求超过 3MB 限制");
    const body = text ? JSON.parse(text) : {};
    if (p[0] === "import")
      return json({ count: await importRecords(body.records) });
    if (p[0] === "sources") {
      if (p[1] && p[2] === "sync") return json(await syncSource(p[1]));
      if (p[1]) {
        const data = z.object({ enabled: z.boolean() }).parse(body);
        return json(await db.source.update({ where: { id: p[1] }, data }));
      }
      const data = z
        .object({
          name: z.string().min(1).max(100),
          kind: z.enum(["rss", "google-trends", "youtube"]),
          url: publicUrl,
          country: z.string().regex(/^(Global|[A-Z]{2})$/),
        })
        .parse(body);
      return json(await db.source.create({ data }));
    }
    if (p[0] === "trends" && p[1]) {
      if (p[2] === "analyze") return json(await analyze(p[1]));
      if (p[2] === "ideas") return json(await generateIdeas(p[1]));
      const data = z
        .object({
          favorite: z.boolean().optional(),
          scene: z.string().max(100).optional(),
          mechanisms: z.array(z.string().max(100)).max(20).optional(),
          emotions: z.array(z.string().max(100)).max(20).optional(),
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
          analysis: analysisSchema.optional(),
        })
        .parse(body);
      const updated = await db.trend.update({
        where: { id: p[1] },
        data: {
          ...data,
          ...(data.analysis
            ? {
                analysis: {
                  ...data.analysis,
                  basis: "人工录入，待证据复核",
                  model: "human",
                  promptVersion: "manual-v1",
                  createdAt: new Date().toISOString(),
                },
              }
            : {}),
        },
      });
      if (data.analysis) await recordScores();
      return json(updated);
    }
    if (p[0] === "ideas" && p[1]) {
      const data = z
        .object({
          title: z.string().min(1).max(200).optional(),
          status: z.enum(statuses as [string, ...string[]]).optional(),
          favorite: z.boolean().optional(),
          rating: z.number().int().min(0).max(5).nullable().optional(),
          tags: z.array(z.string().max(100)).max(50).optional(),
          prompt: z.string().max(20000).optional(),
          content: z.record(z.string(), z.string().max(20000)).optional(),
          campaign: z.record(z.string(), z.string().max(20000)).optional(),
          outcomes: z
            .object({
              gameUrl: publicUrl.or(z.literal("")).optional(),
              videoUrl: publicUrl.or(z.literal("")).optional(),
              country: z.string().max(20).optional(),
              contentType: z.string().max(100).optional(),
              views: z.number().int().nonnegative().optional(),
              clicks: z.number().int().nonnegative().optional(),
              plays: z.number().int().nonnegative().optional(),
              shares: z.number().int().nonnegative().optional(),
              acquisitions: z.number().int().nonnegative().optional(),
              notes: z.string().max(5000).optional(),
            })
            .optional(),
        })
        .parse(body);
      return json(
        await db.$transaction(async (tx) => {
          const previous = await tx.idea.findUniqueOrThrow({
            where: { id: p[1] },
          });
          await tx.ideaVersion.create({
            data: {
              ideaId: p[1],
              data: JSON.parse(
                JSON.stringify(previous),
              ) as Prisma.InputJsonValue,
            },
          });
          return tx.idea.update({ where: { id: p[1] }, data });
        }),
      );
    }
    if (p[0] === "watch") {
      const data = z
        .object({
          keyword: z.string().min(1).max(200),
          country: z.string().regex(/^(Global|[A-Z]{2})$/),
        })
        .parse(body);
      return json(await db.watch.create({ data }));
    }
    if (p[0] === "settings" && p[1] === "scenes") {
      const value = z
        .array(z.string().min(1).max(100))
        .max(50)
        .parse(body.scenes);
      return json(
        await db.setting.upsert({
          where: { key: "scenes" },
          create: { key: "scenes", value },
          update: { value },
        }),
      );
    }
    if (p[0] === "settings") {
      const weights = z
        .object({
          local: z.number().min(0).max(100),
          playable: z.number().min(0).max(100),
          viral: z.number().min(0).max(100),
          heat: z.number().min(0).max(100),
        })
        .refine((v) => Object.values(v).reduce((a, b) => a + b, 0) > 0)
        .parse(body.weights);
      const setting = await db.setting.upsert({
        where: { key: "weights" },
        create: { key: "weights", value: weights },
        update: { value: weights },
      });
      await recordScores();
      return json(setting);
    }
    return NextResponse.json({ error: "接口不存在" }, { status: 404 });
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : e instanceof Error
          ? e.message
          : "操作失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
