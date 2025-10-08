import fs from "fs";
import path from "path";
import { VerificationLog } from "./types.js";


const DB_DIR = path.join(__dirname, "..", "db");
export const VERIFICATION_LOG_FILE = path.join(DB_DIR, "verifications.json");

// Load logs
export function loadLogs(): VerificationLog[] {
  if (!fs.existsSync(VERIFICATION_LOG_FILE)) return [];
  const raw = fs.readFileSync(VERIFICATION_LOG_FILE, "utf8");
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

// Save logs
export function saveLogs(logs: VerificationLog[]) {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(VERIFICATION_LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
}
