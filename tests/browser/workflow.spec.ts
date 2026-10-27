import { test, expect } from "@playwright/test";
test("real persistence workflow: import, validate evidence, create/edit/version/export ideas", async ({
  page,
  request,
}) => {
  const title = `E2E functional record ${Date.now()}`;
  const url = `https://example.com/test/${Date.now()}`;
  const response = await request.post("/api/import", {
    data: {
      records: [
        {
          title,
          url,
          platform: "Manual Test",
          country: "PH",
          language: "English",
          type: "Local Life",
          summary:
            "Authorized test input for persistence verification; not a real trend.",
          keywords: ["functional-test"],
        },
      ],
    },
  });
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).count).toBe(1);
  const invalid = await request.post("/api/import", {
    data: { records: [{ title: "invalid", url: "javascript:alert(1)" }] },
  });
  expect(invalid.status()).toBe(400);
  const trends = await (await request.get("/api/trends")).json();
  const trend = trends.find((t: { url: string }) => t.url === url);
  expect(trend.score.heat).toBeNull();
  expect(trend.score.state).toBe("Insufficient Data");
  await page.goto(`/topics/${trend.id}`);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("没有可验证的数值指标。")).toBeVisible();
  await page.getByRole("button", { name: "Turn Into Game Idea" }).click();
  await expect(page).toHaveURL(/library/);
  const ideas = await (await request.get("/api/ideas")).json();
  const generated = ideas.filter(
    (i: { trendId: string }) => i.trendId === trend.id,
  );
  expect(generated).toHaveLength(3);
  await expect(
    page.getByRole("heading", { name: generated[0].title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: generated[0].title, exact: true }),
    })
    .click();
  await page.getByLabel("工作流状态").selectOption("Approved");
  await page.getByRole("button", { name: "保存创意及版本" }).click();
  await expect(page.getByText("创意已保存，旧版本已归档")).toBeVisible();
  const updated = await (await request.get("/api/ideas")).json();
  expect(
    updated.find((i: { id: string }) => i.id === generated[0].id).status,
  ).toBe("Approved");
  expect(
    updated.find((i: { id: string }) => i.id === generated[0].id).versions,
  ).toHaveLength(1);
  for (const format of ["json", "md", "csv"]) {
    const exported = await request.get(`/api/export/ideas?format=${format}`);
    expect(exported.ok()).toBeTruthy();
    expect(await exported.text()).toContain(title);
  }
  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: "每日选题." })).toBeVisible();
  await page.getByLabel("搜索每日选题").fill(generated[0].title);
  await page.getByLabel("只看人工推荐").check();
  await expect(page.locator(".daily-entry")).toHaveCount(1);
  await page.locator(".daily-entry summary").click();
  await expect(
    page.getByRole("button", { name: "复制游戏 Prompt" }),
  ).toBeVisible();
  await page.getByLabel("每日选题制作难度").selectOption("高");
  await expect(page.getByText("这一天还没有符合条件的选题")).toBeVisible();
  await page.getByLabel("每日选题制作难度").selectOption("");
  await page.screenshot({ path: ".local/library-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "热点总览." })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".local/dashboard-mobile.png",
    fullPage: true,
  });
});
test("all modules load, sources preserve failures and AI credentials are not exposed", async ({
  page,
  request,
}) => {
  for (const route of [
    "/daily",
    "/dashboard",
    "/discover",
    "/local",
    "/games",
    "/creative",
    "/mechanics",
    "/lab",
    "/watchlist",
    "/library",
    "/reports",
    "/sources",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("数据库暂不可用")).toHaveCount(0);
  }
  const config = await (await request.get("/api/settings")).json();
  expect(typeof config.ai).toBe("boolean");
  expect(JSON.stringify(config)).not.toContain("API_KEY");
  const bad = await request.post("/api/sources", {
    data: {
      name: "Restricted target test",
      kind: "rss",
      url: "https://127.0.0.1/private",
      country: "Global",
    },
  });
  const source = await bad.json();
  const sync = await request.post(`/api/sources/${source.id}/sync`, {
    data: {},
  });
  expect(sync.status()).toBe(400);
  expect((await sync.json()).error).toContain("预批准");
  const sources = await (await request.get("/api/sources")).json();
  expect(
    sources.find((s: { id: string }) => s.id === source.id).logs[0].status,
  ).toBe("failed");
});
// Keep test fixtures visibly distinct, and remove them after verification.
test.afterAll(async () => {
  const { db } = await import("../../lib/db");
  const records = await db.trend.findMany({
    where: {
      platform: "Manual Test",
      title: { startsWith: "E2E functional record " },
      url: { startsWith: "https://example.com/test/" },
    },
    select: { id: true },
  });
  const ids = records.map((t) => t.id);
  await db.scoreRecord.deleteMany({ where: { trendId: { in: ids } } });
  await db.trend.deleteMany({ where: { id: { in: ids } } });
  await db.source.deleteMany({
    where: { name: "Restricted target test", url: "https://127.0.0.1/private" },
  });
  await db.$disconnect();
});
test("deduplication preserves markets and stable source keys and import is atomic", async ({
  request,
}) => {
  const url = `https://example.com/test/shared-${Date.now()}`;
  const row = {
    title: "E2E functional record dedup",
    url,
    platform: "Manual Test",
    country: "PH",
    language: "English",
    type: "Meme",
  };
  expect(
    (
      await request.post("/api/import", {
        data: {
          records: [
            { ...row, sourceKey: "first" },
            { ...row, sourceKey: "second" },
            { ...row, country: "PK", sourceKey: "first" },
          ],
        },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post("/api/import", {
        data: { records: [{ ...row, sourceKey: "first" }] },
      })
    ).ok(),
  ).toBeTruthy();
  const rows = await (await request.get("/api/trends")).json();
  const same = rows.filter((t: { url: string }) => t.url === url);
  expect(same).toHaveLength(3);
  expect(new Set(same.map((t: { country: string }) => t.country)).size).toBe(2);
  const batch = await request.post("/api/import", {
    data: { records: [{ ...row, url: url + "-atomic" }, { title: "invalid" }] },
  });
  expect(batch.status()).toBe(400);
  const after = await (await request.get("/api/trends")).json();
  expect(
    after.find((t: { url: string }) => t.url === url + "-atomic"),
  ).toBeUndefined();
  const csrf = await request.post("/api/watch", {
    headers: { Origin: "https://unrelated.invalid" },
    data: { keyword: "should fail", country: "PH" },
  });
  expect(csrf.status()).toBe(403);
});
