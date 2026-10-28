import test from "node:test";
import assert from "node:assert/strict";
import { applyLocalAiConfig } from "../scripts/local-ai-config.mjs";
import { aiHttpError } from "../lib/ai-errors";
test("explicit empty local key disables an inherited Windows key without overwriting other variables", () => {
  const inherited = {
    OPENAI_API_KEY: "unrelated-other-tool",
    DATABASE_URL: "preserved",
    OPENAI_MODEL: "old",
  };
  applyLocalAiConfig(
    { OPENAI_API_KEY: "", OPENAI_MODEL: " gpt-4o-mini " },
    inherited,
  );
  assert.equal(inherited.OPENAI_API_KEY, "");
  assert.equal(inherited.OPENAI_MODEL, "gpt-4o-mini");
  assert.equal(inherited.DATABASE_URL, "preserved");
});
test("omitted local AI fields preserve existing credentials and whitespace is trimmed", () => {
  const environment = { OPENAI_API_KEY: "existing" };
  applyLocalAiConfig({}, environment);
  assert.equal(environment.OPENAI_API_KEY, "existing");
  applyLocalAiConfig(
    { OPENAI_API_KEY: "  placeholder-test-key  " },
    environment,
  );
  assert.equal(environment.OPENAI_API_KEY, "placeholder-test-key");
});
test("AI errors distinguish authentication, authorization and quota, with actionable non-secret guidance", () => {
  assert.match(aiHttpError(401).message, /身份验证.*401/);
  assert.match(aiHttpError(401).message, /规则草案/);
  assert.match(aiHttpError(403).message, /权限/);
  assert.match(aiHttpError(429).message, /配额/);
  assert.match(aiHttpError(503).message, /暂不可用/);
});
