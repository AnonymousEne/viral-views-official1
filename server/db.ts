import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "./sqlite-schema";
import path from 'path';
import fs from 'fs';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Extract the file path from the file: URL and make it absolute
let dbPath = process.env.DATABASE_URL.replace('file:', '');
if (!path.isAbsolute(dbPath)) {
  dbPath = path.resolve(process.cwd(), 'server', dbPath);
}

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
