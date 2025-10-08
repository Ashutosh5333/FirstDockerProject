import fs from "fs";
import path from "path";
import { IssuedRecord } from "./types.js";
import dotenv from "dotenv";
dotenv.config();


// const DB_DIR = path.join(__dirname, "..", "db");
// // export const DATA_FILE = path.join(DB_DIR, "issued.json");
// export const DATA_FILE = process.env.DATA_FILE ?? path.join(DB_DIR, "issued.json");
const DB_DIR = path.join(__dirname, "..", "db");
export const DATA_FILE = process.env.DATA_FILE ?? path.join(DB_DIR, "issued.json");

export function getDataFile() {
  return process.env.TEST_DB_FILE ?? DATA_FILE;  // ✅ Use TEST_DB_FILE for tests
}


// Load DB
// export function loadDb(): Record<string, IssuedRecord> {
//   if (!fs.existsSync(DATA_FILE)) return {};
//   const raw = fs.readFileSync(DATA_FILE, "utf8");
//   if (!raw.trim()) return {};
//   return JSON.parse(raw);
// }

// // Save DB
// export function saveDb(db: Record<string, IssuedRecord>) {
//   if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
//   fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
// }


// export function getDataFile() {
//   return DATA_FILE;
// }