/**
 * Applies prisma/rls.sql against DATABASE_URL. Run this once after the
 * initial `prisma migrate deploy`, and again any time a migration touches
 * a table listed in rls.sql (Prisma migrations don't preserve RLS policies
 * across a `DROP TABLE` / recreate).
 *
 * Usage: npm run prisma:apply-rls
 */
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

async function main() {
  const sql = readFileSync(join(__dirname, "..", "prisma", "rls.sql"), "utf-8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql);
    console.log("RLS policies applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed to apply RLS policies:", err);
  process.exit(1);
});
