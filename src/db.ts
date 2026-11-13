import "dotenv/config";
import { Pool } from "pg";

// Lee DATABASE_URL directo (sin pasar por config.ts) para que scripts como la
// migracion puedan correr sin tener configuradas todavia las llaves de Meta/Anthropic.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Falta la variable de entorno DATABASE_URL (revisa tu .env)");
}

export const pool = new Pool({ connectionString: databaseUrl });
