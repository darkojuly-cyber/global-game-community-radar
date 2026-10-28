import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  readdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { startupErrorMessage } from "./startup-errors.mjs";

// Native PostgreSQL utilities inherit the full OS environment, including
// Windows SystemRoot and PATH. No shell or locale-dependent readiness parsing.
export function runPostgresCommand(
  binary,
  args,
  { spawnProcess = spawn, onOutput = () => {}, timeout = 45000 } = {},
) {
  return new Promise((resolve, reject) => {
    let output = "",
      settled = false,
      timedOut = false;
    const child = spawnProcess(binary, args, {
      env: { ...process.env, LC_MESSAGES: "C" },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      error ? reject(error) : resolve(output);
    };
    const collect = (data) => {
      const text = data.toString();
      output = (output + text).slice(-16000);
      onOutput(text);
    };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
      finish(new Error(`PostgreSQL command timed out: ${binary}\n${output}`));
    }, timeout);
    child.once("error", (error) =>
      finish(
        new Error(
          `Cannot start PostgreSQL utility: ${startupErrorMessage(error)}`,
        ),
      ),
    );
    child.once("close", (code, signal) => {
      if (timedOut) return;
      finish(
        code === 0
          ? null
          : new Error(
              `PostgreSQL utility exited with code ${code}, signal ${signal ?? "none"}.\n${output || "No diagnostic output."}`,
            ),
      );
    });
  });
}
export async function createNativeDatabase({
  binaries,
  dataDir,
  logFile,
  port = 55432,
  user = "radar",
  password = "radar_local",
  onOutput = console.log,
}) {
  const command = (name) => {
    const path = binaries[name];
    if (typeof path !== "string")
      throw Error(`PostgreSQL package has no ${name} executable.`);
    return existsSync(path) ? path : path + ".exe";
  };
  mkdirSync(dirname(dataDir), { recursive: true });
  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    if (existsSync(dataDir) && readdirSync(dataDir).length)
      throw Error(
        `PostgreSQL initialization is incomplete at ${dataDir}. Existing files were preserved; do not delete them without checking their contents.`,
      );
    const passwordFile = join(tmpdir(), `radar-pg-${randomUUID()}`);
    try {
      writeFileSync(passwordFile, password + "\n", { mode: 0o600, flag: "wx" });
      await runPostgresCommand(
        command("initdb"),
        [
          "--pgdata=" + dataDir,
          "--auth=password",
          "--username=" + user,
          "--pwfile=" + passwordFile,
          "--locale=C",
          "--encoding=UTF8",
        ],
        { onOutput },
      );
    } finally {
      if (existsSync(passwordFile)) unlinkSync(passwordFile);
    }
  }
  mkdirSync(dirname(logFile), { recursive: true });
  try {
    await runPostgresCommand(
      command("pg_ctl"),
      [
        "start",
        "-D",
        dataDir,
        "-l",
        logFile,
        "-w",
        "-t",
        "30",
        "-o",
        `-p ${port} -h 127.0.0.1`,
      ],
      { onOutput },
    );
  } catch (error) {
    let log = "";
    try {
      log = readFileSync(logFile, "utf8").slice(-16000);
    } catch {}
    throw Error(
      `${startupErrorMessage(error)}\nPostgreSQL server log: ${logFile}\n${log}`,
    );
  }
  const { default: pg } = await import("pg");
  const client = (database = "postgres") =>
    new pg.Client({
      host: "127.0.0.1",
      port,
      user,
      password,
      database,
      connectionTimeoutMillis: 5000,
    });
  let stopped = false;
  return {
    getPgClient: client,
    async createDatabase(name) {
      const c = client();
      try {
        await c.connect();
        await c.query("CREATE DATABASE " + c.escapeIdentifier(name));
      } finally {
        await c.end();
      }
    },
    async stop() {
      if (stopped) return;
      await runPostgresCommand(
        command("pg_ctl"),
        ["stop", "-D", dataDir, "-m", "fast", "-w", "-t", "30"],
        { onOutput },
      );
      stopped = true;
    },
  };
}
