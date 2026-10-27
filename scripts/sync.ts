import { db } from "../lib/db";
import { syncSource } from "../lib/ingest";
async function main() {
  for (const s of await db.source.findMany({ where: { enabled: true } })) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await syncSource(s.id);
        console.log(s.name, result.count, "records");
        break;
      } catch (e) {
        console.error(
          s.name,
          `attempt ${attempt}`,
          e instanceof Error ? e.message : "failed",
        );
        if (attempt < 3)
          await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  await db.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
