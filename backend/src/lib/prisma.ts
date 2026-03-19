import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../generated/prisma/client");

const connectionString = process.env.DATABASE_URL || "";

const pool = new pg.Pool({
  connectionString,
  // Enable SSL for cloud databases (Neon, Render, etc.)
  ssl:
    connectionString.includes("neon.tech") ||
    connectionString.includes("render.com")
      ? { rejectUnauthorized: false }
      : undefined,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
