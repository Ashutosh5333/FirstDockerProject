
import fs from "fs";

export const VERIFICATION_LOG_FILE = process.env.VERIFICATION_LOG_FILE ?? "./db/verifications.json";

export function readJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

export function writeJson<T>(file: string, data: T) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

