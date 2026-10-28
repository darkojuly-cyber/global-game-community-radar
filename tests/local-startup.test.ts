import test from "node:test";
import type { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { startupErrorMessage } from "../scripts/startup-errors.mjs";
import { runPostgresCommand } from "../scripts/native-postgres.mjs";
test("launcher reports undefined, null, string and Error rejections without a second crash", () => {
  for (const input of [
    undefined,
    null,
    "native startup failed",
    new Error("specific error"),
  ])
    assert.equal(typeof startupErrorMessage(input), "string");
  assert.match(startupErrorMessage(undefined), /postgres-startup.log/);
  assert.equal(
    startupErrorMessage("native startup failed"),
    "native startup failed",
  );
});
test("PostgreSQL inherits Windows environment, preserves spaces in arguments and surfaces stderr", async () => {
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:\\Windows";
  try {
    const spawnProcess = (
      binary: string,
      args: string[],
      options: { env: NodeJS.ProcessEnv; windowsHide: boolean },
    ) => {
      assert.equal(options.env.SystemRoot, "C:\\Windows");
      assert.equal(options.env.PATH, process.env.PATH);
      assert.equal(options.windowsHide, true);
      assert.equal(args[1], "D:\\community radar\\data");
      const child = Object.assign(new EventEmitter(), {
        stdout: new PassThrough(),
        stderr: new PassThrough(),
        kill: () => {},
      });
      queueMicrotask(() => {
        child.stderr.write("could not bind port");
        child.emit("close", 1, null);
      });
      return child;
    };
    await assert.rejects(
      runPostgresCommand("postgres.exe", ["-D", "D:\\community radar\\data"], {
        spawnProcess: spawnProcess as unknown as typeof spawn,
      }),
      /code 1[\s\S]*could not bind port/,
    );
  } finally {
    if (previous === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previous;
  }
});
test("pg_ctl exit resolves even when background process keeps output pipes open", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    kill: () => {},
  });
  const spawnProcess = () => {
    queueMicrotask(() => {
      child.stdout.write("server started");
      child.emit("exit", 0, null);
    });
    return child;
  };
  const result = await runPostgresCommand("pg_ctl.exe", ["start"], {
    timeout: 500,
    spawnProcess: spawnProcess as unknown as typeof spawn,
  });
  assert.match(result, /server started/);
  assert.equal(child.stdout.destroyed, true);
  assert.equal(child.stderr.destroyed, true);
});
