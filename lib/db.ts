import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzleHttp({
  client: sql,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const transactionDb = drizzleServerless(pool);
