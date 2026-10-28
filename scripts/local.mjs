import { spawn } from "node:child_process";
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { dirname, resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { startupErrorMessage } from "./startup-errors.mjs";
import { appendFileSync } from "node:fs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const major = Number(process.versions.node.split(".")[0]);
if (major < 24) {
  console.error(
    "Please install Node.js 24 or later from https://nodejs.org/ and launch again.",
  );
  process.exit(1);
}
mkdirSync(".local", { recursive: true });
process.env.npm_config_cache = resolve(".local/npm-cache");
process.env.NODE_USE_ENV_PROXY ??= "1";
if (!existsSync(".env")) copyFileSync(".env.example", ".env");
let app,
  ownedDatabase,
  stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (app && app.exitCode === null) {
    const exited = new Promise((r) => app.once("exit", r));
    app.kill("SIGTERM");
    await Promise.race([exited, new Promise((r) => setTimeout(r, 3000))]);
    if (app.exitCode === null) app.kill("SIGKILL");
  }
  if (ownedDatabase) {
    try {
      await ownedDatabase.stop();
    } catch (error) {
      console.error("Database shutdown:", startupErrorMessage(error));
    }
  }
  process.exit(code);
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
function npm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      args,
      {
        cwd: root,
        env: process.env,
        stdio: "inherit",
        shell: process.platform === "win32",
      },
    );
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(Error(`npm ${args.join(" ")} exited with ${code}`)),
    );
  });
}
function fingerprint() {
  const hash = createHash("sha256");
  const paths = [
    "app",
    "lib",
    "prisma",
    "middleware.ts",
    "next.config.ts",
    "postcss.config.mjs",
    "tsconfig.json",
    "package.json",
    "package-lock.json",
  ];
  function visit(path) {
    if (!existsSync(path)) return;
    const info = readdirSafe(path);
    if (info) {
      for (const child of info.sort()) visit(join(path, child));
    } else {
      hash.update(relative(root, resolve(path)));
      hash.update(readFileSync(path));
    }
  }
  function readdirSafe(path) {
    try {
      return readdirSync(path);
    } catch {
      return null;
    }
  }
  for (const p of paths) visit(p);
  return hash.digest("hex");
}
async function freePort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}
async function main() {
  console.log("\nEvoMeme Trend Radar — local launcher\n");
  if (!existsSync("node_modules/.package-lock.json")) {
    console.log(
      "Installing locked dependencies. First launch requires Internet access.",
    );
    await npm(["ci"]);
  }
  await import("dotenv/config");
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is missing in .env");
  const { default: pg } = await import("pg");
  async function connected() {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 2000,
    });
    try {
      await client.connect();
      await client.query("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      await client.end().catch(() => {});
    }
  }
  if (!(await connected())) {
    const u = new URL(process.env.DATABASE_URL);
    if (
      u.hostname !== "127.0.0.1" ||
      u.port !== "55432" ||
      u.pathname !== "/radar" ||
      u.username !== "radar" ||
      u.password !== "radar_local"
    )
      throw Error(
        "Configured database is unavailable. Check .env; it will not be replaced.",
      );
    console.log("Starting persistent local PostgreSQL...");
    const databaseOutput = (message) => {
      console.log(message);
      try {
        appendFileSync(".local/postgres-startup.log", String(message) + "\n");
      } catch {
        console.error(
          "Could not append startup log; diagnostics are shown above.",
        );
      }
    };
    if (process.platform === "win32") {
      const { createNativeDatabase } = await import("./native-postgres.mjs");
      const binaries = await import("@embedded-postgres/windows-x64");
      ownedDatabase = await createNativeDatabase({
        binaries,
        dataDir: resolve(".local/postgres"),
        logFile: resolve(".local/postgres-startup.log"),
        onOutput: databaseOutput,
      });
    } else {
      const { default: EmbeddedPostgres } = await import("embedded-postgres");
      ownedDatabase = new EmbeddedPostgres({
        databaseDir: resolve(".local/postgres"),
        user: "radar",
        password: "radar_local",
        port: 55432,
        persistent: true,
        onLog: databaseOutput,
        onError: console.error,
      });
      if (!existsSync(".local/postgres/PG_VERSION"))
        await ownedDatabase.initialise();
      await ownedDatabase.start();
    }
    const client = ownedDatabase.getPgClient();
    await client.connect();
    const found = await client.query(
      "SELECT 1 FROM pg_database WHERE datname='radar'",
    );
    await client.end();
    if (!found.rowCount) await ownedDatabase.createDatabase("radar");
    if (!(await connected()))
      throw Error("Local PostgreSQL failed its connection check.");
  }
  await npm(["run", "db:generate"]);
  await npm(["run", "db:push"]);
  const stamp = fingerprint();
  if (
    !existsSync(".next/BUILD_ID") ||
    !existsSync(".local/build-stamp") ||
    readFileSync(".local/build-stamp", "utf8") !== stamp
  ) {
    console.log("Building application. Later launches reuse this build.");
    await npm(["run", "build"]);
    writeFileSync(".local/build-stamp", stamp);
  }
  let port = Number(process.env.RADAR_LOCAL_PORT ?? 3030);
  if (!Number.isInteger(port) || port < 1024 || port > 65525)
    throw Error("RADAR_LOCAL_PORT must be an integer between 1024 and 65525.");
  while (!(await freePort(port))) {
    port++;
    if (port > 65535) throw Error("No free local port.");
  }
  const url = `http://127.0.0.1:${port}`;
  app = spawn(
    process.execPath,
    [
      "--use-env-proxy",
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: root, env: process.env, stdio: "inherit" },
  );
  let failed = false;
  app.once("error", (e) => {
    console.error(e.message);
    failed = true;
  });
  app.once("exit", () => {
    if (!stopping) {
      failed = true;
      void stop(1);
    }
  });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (failed) break;
    try {
      const response = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok && (await response.json()).database === "ok") {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready)
    throw Error("Application health check failed; see startup output above.");
  console.log(
    `\nREADY: ${url}/daily\nKeep this window open. Press Ctrl+C to stop. Data remains in .local/postgres.\n`,
  );
  if (!process.argv.includes("--no-open")) {
    const command =
      process.platform === "win32"
        ? "cmd"
        : process.platform === "darwin"
          ? "open"
          : "xdg-open";
    const args =
      process.platform === "win32"
        ? ["/c", "start", "", url + "/daily"]
        : [url + "/daily"];
    const browser = spawn(command, args, { stdio: "ignore", detached: true });
    browser.on("error", () =>
      console.log("Open the READY address in your browser."),
    );
    browser.unref();
  }
}
main().catch(async (e) => {
  console.error("\nStartup failed:", startupErrorMessage(e));
  console.error(
    "No database has been reset. Save this output for troubleshooting.",
  );
  await stop(1);
});
