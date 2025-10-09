import fs from "fs";
import { getDataFile } from "../db.js";

export function loadDb() {
  const file = getDataFile();
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

export function saveDb(db: Record<string, any>) {
  const file = getDataFile();
  fs.writeFileSync(file, JSON.stringify(db, null, 2), "utf8");
}
