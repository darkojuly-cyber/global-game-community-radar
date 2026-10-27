import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
test("access control rejects missing/wrong credentials and allows valid credentials", () => {
  const previousUser = process.env.RADAR_USER,
    previousPassword = process.env.RADAR_PASSWORD;
  try {
    process.env.RADAR_USER = "test-user";
    process.env.RADAR_PASSWORD = "temporary-test-only";
    const request = (value?: string) =>
      new NextRequest("https://radar.example/dashboard", {
        headers: value
          ? { Authorization: "Basic " + Buffer.from(value).toString("base64") }
          : {},
      });
    assert.equal(middleware(request()).status, 401);
    assert.equal(middleware(request("test-user:wrong")).status, 401);
    assert.equal(
      middleware(request("test-user:temporary-test-only")).status,
      200,
    );
    delete process.env.RADAR_PASSWORD;
    assert.equal(middleware(request()).status, 503);
  } finally {
    if (previousUser === undefined) delete process.env.RADAR_USER;
    else process.env.RADAR_USER = previousUser;
    if (previousPassword === undefined) delete process.env.RADAR_PASSWORD;
    else process.env.RADAR_PASSWORD = previousPassword;
  }
});
