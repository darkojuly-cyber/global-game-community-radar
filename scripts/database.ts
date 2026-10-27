import EmbeddedPostgres from "embedded-postgres";
import { existsSync, mkdirSync } from "node:fs";
async function main() {
  mkdirSync(".local", { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir: ".local/postgres",
    user: "radar",
    password: "radar_local",
    port: 55432,
    persistent: true,
    onLog: () => {},
    onError: console.error,
  });
  if (!existsSync(".local/postgres/PG_VERSION")) await pg.initialise();
  await pg.start();
  const client = pg.getPgClient();
  await client.connect();
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'radar'",
  );
  await client.end();
  if (!result.rowCount) await pg.createDatabase("radar");
  console.log("PostgreSQL ready on 127.0.0.1:55432; database radar");
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 60000);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
