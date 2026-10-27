import { db } from "./db";
import { defaultWeights, score } from "./domain";
export async function recordScores() {
  const trends = await db.trend.findMany({ include: { snapshots: true } });
  const weights =
    ((await db.setting.findUnique({ where: { key: "weights" } }))?.value as
      typeof defaultWeights | null) ?? defaultWeights;
  if (trends.length)
    await db.scoreRecord.createMany({
      data: trends.map((t) => ({
        trendId: t.id,
        result: {
          ...score(t, trends, weights),
          analysisMetadata: t.analysis ?? null,
        },
        weights,
        ruleVersion: "scores-v1",
      })),
    });
}
