import fs from "fs";
import { getDataFile } from "../db.js";
import crypto from "crypto";

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

// Stable JSON stringify
export function stableStringify(obj: any): string {
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  if (obj && typeof obj === "object") {
    const keys = Object.keys(obj).sort();
    const entries = keys.map(
      (k) => `"${k}":${stableStringify((obj as any)[k])}`
    );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(obj);
}

// Compute SHA-256 hash for credential
export function computeCredentialId(credential: unknown): string {
  const payload = stableStringify(credential);
  return crypto.createHash("sha256").update(payload).digest("hex");
}
