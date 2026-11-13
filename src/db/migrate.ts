import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "../db";

async function migrate() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  await pool.query(sql);
  console.log("Migracion aplicada correctamente.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Error aplicando la migracion:", err);
  process.exit(1);
});
