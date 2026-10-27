export const countries = ["Global", "PH", "PK", "US", "GB", "CA", "DE", "FR"];
export const types = [
  "Meme",
  "Local Life",
  "Entertainment",
  "AI",
  "Gaming",
  "Mini Games",
  "Playable Ads",
  "Short Videos",
  "Social Challenges",
];
export const mechanisms = [
  "Fail & Retry",
  "Satisfying",
  "Impossible Choice",
  "Guess & Reveal",
  "Challenge",
  "Remixable",
  "Social Identity",
  "Absurd Humor",
  "Curiosity Gap",
];
export const scenes = [
  "Campus & School",
  "Work & Daily Stress",
  "Friends & Relationships",
  "Food & Lifestyle",
  "Entertainment & Gaming",
  "Sports & Events",
];
export const emotions = [
  "Relatable",
  "Frustrating",
  "Funny",
  "Awkward",
  "Nostalgic",
  "Satisfying",
  "Competitive",
  "Surprising",
  "Absurd",
  "Exciting",
];
export const statuses = [
  "Backlog",
  "Evaluating",
  "Approved",
  "In Production",
  "Published",
  "Reviewing",
  "Archived",
];
export const defaultWeights = { local: 25, playable: 30, viral: 25, heat: 20 };
export type Weights = typeof defaultWeights;
export type Snap = {
  metric: string;
  value: number;
  capturedAt: Date | string;
  provenance: string;
};
export type Evidence = {
  platform: string;
  country: string;
  type: string;
  url: string;
  collectedAt: Date | string;
  snapshots: Snap[];
  analysis?: unknown;
};
export function primarySnapshots(snapshots: Snap[]) {
  const metrics = [...new Set(snapshots.map((s) => s.metric))];
  const metric =
    [
      "viewCount",
      "views",
      "approx_searches_lower_bound",
      "likeCount",
      "commentCount",
    ].find((m) => metrics.includes(m)) ?? metrics.sort()[0];
  return snapshots
    .filter((s) => s.metric === metric)
    .sort((a, b) => +new Date(a.capturedAt) - +new Date(b.capturedAt));
}
export function growth(snapshots: Snap[], hours: number) {
  const ordered = primarySnapshots(snapshots);
  const latest = ordered.at(-1);
  if (!latest || latest.metric.includes("lower_bound")) return null;
  const earlier = ordered
    .filter(
      (s) =>
        s.metric === latest.metric &&
        s.provenance === latest.provenance &&
        +new Date(s.capturedAt) <=
          +new Date(latest.capturedAt) - hours * 3600000,
    )
    .at(-1);
  if (
    !earlier ||
    earlier.value <= 0 ||
    +new Date(latest.capturedAt) - +new Date(earlier.capturedAt) >
      hours * 3600000 * 1.25
  )
    return null;
  return (
    Math.round(((latest.value - earlier.value) / earlier.value) * 1000) / 10
  );
}
export function score(
  item: Evidence,
  cohort: Evidence[],
  weights: Weights = defaultWeights,
) {
  const latest = primarySnapshots(item.snapshots).at(-1);
  const comparable = latest
    ? cohort
        .filter(
          (t) =>
            t.platform === item.platform &&
            t.country === item.country &&
            t.type === item.type,
        )
        .flatMap((t) => {
          const s = [...t.snapshots]
            .filter(
              (s) =>
                s.metric === latest.metric &&
                s.provenance === latest.provenance,
            )
            .sort(
              (a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt),
            )[0];
          return s ? [s.value] : [];
        })
    : [];
  const heat =
    latest && comparable.length >= 3
      ? Math.round(
          (comparable.filter((n) => n < latest.value).length /
            Math.max(1, comparable.length - 1)) *
            100,
        )
      : null;
  const a = item.analysis as {
    scores?: { local?: number; playable?: number; viral?: number };
  } | null;
  const local = a?.scores?.local ?? null,
    playable = a?.scores?.playable ?? null,
    viral = a?.scores?.viral ?? null;
  const age = (Date.now() - +new Date(item.collectedAt)) / 3600000;
  const confidence = Math.min(
    100,
    (item.url ? 20 : 0) +
      (latest ? 20 : 0) +
      (age < 24 ? 20 : age < 168 ? 10 : 0) +
      (comparable.length >= 3 ? 15 : 0) +
      (item.snapshots.length >= 2 ? 15 : 0),
  );
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const opportunity =
    [heat, local, playable, viral].every((n) => n !== null) && total > 0
      ? Math.round(
          (((heat! * weights.heat +
            local! * weights.local +
            playable! * weights.playable +
            viral! * weights.viral) /
            total) *
            confidence) /
            100,
        )
      : null;
  const g = growth(item.snapshots, 24);
  return {
    heat,
    local,
    playable,
    viral,
    confidence,
    opportunity,
    growth24: g,
    state:
      g === null
        ? "Insufficient Data"
        : g > 100
          ? "Breaking Out"
          : g > 20
            ? "Emerging"
            : g < -20
              ? "Fading"
              : "Sustained",
    reason:
      heat === null
        ? "同平台、国家、类型及指标的可比样本不足 3 条；不计算热度排名。"
        : "热度为同平台、国家、类型及同指标样本内的相对位置。",
    version: "scores-v1",
    cohortSize: comparable.length,
  };
}
export function cluster<T extends { keywords: string[] }>(items: T[]) {
  const groups: T[][] = [];
  for (const item of items) {
    const keys = new Set(item.keywords.map((s) => s.toLowerCase()));
    const group = groups.find((g) =>
      g.some((t) => {
        const b = new Set(t.keywords.map((s) => s.toLowerCase()));
        const common = [...keys].filter((k) => b.has(k)).length;
        return common > 0 && common / new Set([...keys, ...b]).size >= 0.5;
      }),
    );
    if (group) group.push(item);
    else groups.push([item]);
  }
  return groups;
}

export function editionDay(value: Date | string = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
