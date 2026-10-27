import test from "node:test";
import assert from "node:assert/strict";
import { score, growth, cluster } from "../lib/domain";
import { recordSchema } from "../lib/ingest";
import { makeIdea } from "../lib/creative";
const now = new Date().toISOString();
const sample = (value: number, country = "PH", platform = "YouTube") => ({
  platform,
  country,
  type: "Gaming",
  url: "https://example.com",
  collectedAt: now,
  snapshots: [
    { metric: "viewCount", value, capturedAt: now, provenance: "official" },
  ],
});
test("heat only compares same platform, country, type and metric", () => {
  const a = sample(20);
  const cohort = [
    sample(10),
    a,
    sample(30),
    sample(99999, "US"),
    sample(99999, "PH", "TikTok"),
  ];
  assert.equal(score(a, cohort).heat, 50);
  assert.equal(score(a, cohort).cohortSize, 3);
});
test("insufficient samples produce missing heat and opportunity, never invented zeros", () => {
  const a = sample(10);
  const s = score(a, [a]);
  assert.equal(s.heat, null);
  assert.equal(s.opportunity, null);
  assert.equal(s.state, "Insufficient Data");
  assert.equal(s.growth24, null);
});
test("objective heat does not invent subjective local and playable scores", () => {
  const a = sample(20);
  const s = score(a, [sample(10), a, sample(30)]);
  assert.equal(s.local, null);
  assert.equal(s.playable, null);
  assert.equal(s.viral, null);
  assert.equal(s.opportunity, null);
});
test("growth requires same metric and provenance, nonzero comparable baseline", () => {
  const snapshots = [
    {
      metric: "views",
      value: 100,
      capturedAt: "2026-01-01T00:00:00Z",
      provenance: "official",
    },
    {
      metric: "views",
      value: 150,
      capturedAt: "2026-01-02T00:00:00Z",
      provenance: "official",
    },
  ];
  assert.equal(growth(snapshots, 24), 50);
  assert.equal(
    growth([{ ...snapshots[0], provenance: "manual" }, snapshots[1]], 24),
    null,
  );
  assert.equal(growth([{ ...snapshots[0], value: 0 }, snapshots[1]], 24), null);
});
test("opportunity is corrected by evidence quality and normalized weights", () => {
  const a = {
    ...sample(20),
    analysis: { scores: { local: 80, playable: 80, viral: 80 } },
  };
  const cohort = [sample(10), a, sample(30)];
  const s = score(a, cohort);
  assert.ok(s.opportunity! < 80);
  assert.equal(
    s.opportunity,
    Math.round(((80 * 0.8 + 50 * 0.2) * s.confidence) / 100),
  );
});
test("clustering groups shared keywords without inventing country relationships", () => {
  const a = { keywords: ["AI", "Game"] },
    b = { keywords: ["ai", "game", "tools"] },
    c = { keywords: ["cricket"] };
  assert.deepEqual(cluster([a, b, c]), [[a, b], [c]]);
  assert.deepEqual(
    cluster([{ keywords: [] }, { keywords: [] }]).map((g) => g.length),
    [1, 1],
  );
});
test("import rejects script URLs, missing countries and unverified metric shapes", () => {
  assert.equal(
    recordSchema.safeParse({
      title: "x",
      url: "javascript:alert(1)",
      platform: "RSS",
      country: "PH",
      language: "English",
      type: "Meme",
    }).success,
    false,
  );
  assert.equal(
    recordSchema.safeParse({
      title: "x",
      url: "https://example.com",
      platform: "RSS",
      country: "Asia",
      language: "English",
      type: "Meme",
    }).success,
    false,
  );
  assert.equal(
    recordSchema.safeParse({
      title: "x",
      url: "https://example.com",
      platform: "RSS",
      country: "PH",
      language: "English",
      type: "Meme",
      snapshots: [{ metric: "views", value: 12 }],
    }).success,
    false,
  );
});
test("rule ideas expose all design fields, actionable prompt and unverified generation", () => {
  for (const direction of [
    "Quick Prototype",
    "Viral-first",
    "Creative Twist",
  ]) {
    const idea = makeIdea(
      "A real user theme",
      "PH",
      "Original source text",
      direction,
    );
    assert.equal(Object.keys(idea.content).length, 23);
    assert.ok(idea.prompt.length > 1000);
    assert.match(idea.content.generation, /规则模板/);
    assert.match(idea.content.evoMemeFit, /消费侧.*创作者侧/);
    assert.equal(idea.direction, direction);
  }
});
test("approximate lower bounds and distant baselines never become exact growth", () => {
  const old = {
    metric: "approx_searches_lower_bound",
    value: 100,
    capturedAt: "2026-01-01T00:00:00Z",
    provenance: "rss",
  };
  const current = { ...old, value: 200, capturedAt: "2026-01-02T00:00:00Z" };
  assert.equal(growth([old, current], 24), null);
  assert.equal(
    growth(
      [
        { ...old, metric: "views", capturedAt: "2025-01-01T00:00:00Z" },
        { ...current, metric: "views" },
      ],
      24,
    ),
    null,
  );
});
test("primary metric stays stable when API returns multiple engagement counters", () => {
  const a = sample(20);
  a.snapshots.push({ ...a.snapshots[0], metric: "commentCount", value: 999 });
  assert.equal(score(a, [sample(10), a, sample(30)]).heat, 50);
});

test("daily archive dates respect Shanghai midnight and year boundary", async () => {
  const { editionDay } = await import("../lib/domain");
  assert.equal(editionDay("2026-10-27T15:59:59Z"), "2026-10-27");
  assert.equal(editionDay("2026-10-27T16:00:00Z"), "2026-10-28");
  assert.equal(editionDay("2026-12-31T16:00:00Z"), "2027-01-01");
});
