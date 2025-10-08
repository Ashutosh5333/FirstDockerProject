import fs from "fs";
import path from "path";
import { IssuedRecord } from "./types.js";


const DB_DIR = path.join(__dirname, "..", "db");
export const DATA_FILE = path.join(DB_DIR, "issued.json");

// Load DB
export function loadDb(): Record<string, IssuedRecord> {
  if (!fs.existsSync(DATA_FILE)) return {};
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

// Save DB
export function saveDb(db: Record<string, IssuedRecord>) {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}
