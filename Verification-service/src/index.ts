import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type IssuedRecord = {
  id: string;
  issued_at: string;
  worker_id: string;
  credential: unknown;
};

type VerificationLog = {
  id: string;
  verified_at: string;
  verifier_worker_id: string;
  result: "valid" | "invalid";
};

const app = express();
app.use(express.json());

const PORT = Number(process.env.VERIFICATION_PORT ?? 3002);
const WORKER_ID = String(process.env.WORKER_ID ?? "worker-1");

const DB_DIR = path.join(__dirname, "..", "db");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const VERIFICATION_LOG_FILE = String(
  process.env.VERIFICATION_LOG_FILE ?? path.join(DB_DIR, "verifications.json")
);

// For v1 simplicity, point to issuer's issued.json file via env/config
const DEFAULT_ISSUED_DB_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "Issuance-service",
  "db",
  "issued.json"
);
const ISSUED_DB_PATH = String(
  process.env.ISSUED_DB_PATH ?? DEFAULT_ISSUED_DB_PATH
);

function stableStringify(obj: any): string {
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

function computeCredentialId(credential: unknown): string {
  const payload = stableStringify(credential);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function readJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

function writeJson<T>(file: string, data: T) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", worker_id: WORKER_ID });
});

app.post("/verify", (req, res) => {
  const credential = req.body;
  const id = computeCredentialId(credential);

  const issuedDb = readJson<Record<string, IssuedRecord>>(ISSUED_DB_PATH, {});
  const found = issuedDb[id];

  const verified_at = new Date().toISOString();

  const logs = readJson<VerificationLog[]>(VERIFICATION_LOG_FILE, []);
  if (!found) {
    logs.push({
      id,
      verified_at,
      verifier_worker_id: WORKER_ID,
      result: "invalid",
    });
    writeJson(VERIFICATION_LOG_FILE, logs);
    return res
      .status(404)
      .json({ valid: false, id, message: "credential not issued" });
  }

  logs.push({
    id,
    verified_at,
    verifier_worker_id: WORKER_ID,
    result: "valid",
  });
  writeJson(VERIFICATION_LOG_FILE, logs);

  return res.json({
    valid: true,
    id,
    issued_at: found.issued_at,
    issued_by_worker: found.worker_id,
    verifier_worker_id: WORKER_ID,
    verified_at,
  });
});

app.listen(PORT, () => {
  console.log(`Verifier listening on http://localhost:${PORT} as ${WORKER_ID}`);
});
