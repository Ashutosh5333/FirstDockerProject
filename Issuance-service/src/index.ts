import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type IssuedRecord = {
  id: string;
  issued_at: string;
  worker_id: string;
  credential: unknown;
};

const app = express();

// Parse JSON request bodies
app.use(express.json());

const PORT = Number(process.env.ISSUANCE_PORT ?? 4001);
const WORKER_ID = String(process.env.WORKER_ID ?? "worker-1");

const DB_DIR = path.join(__dirname, "..", "db");
const DATA_FILE = String(
  process.env.DATA_FILE ?? path.join(DB_DIR, "issued.json")
);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function stableStringify(obj: any): string {
  // Recursively sort object keys for stable hashing
  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(",")}]`;
  }
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

function loadDb(): Record<string, IssuedRecord> {
  if (!fs.existsSync(DATA_FILE)) return {};
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function saveDb(db: Record<string, IssuedRecord>) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", worker_id: WORKER_ID });
});

app.get("/issued/:id", (req, res) => {
  const id = req.params.id;
  const db = loadDb();
  const rec = db[id];
  if (!rec) return res.status(404).json({ error: "not found", id });
  return res.json(rec);
});

app.post("/issue", (req, res) => {
  const credential = req.body; // must be JSON
  const id = computeCredentialId(credential);

  const db = loadDb();
  const existing = db[id];
  if (existing) {
    return res.status(200).json({
      message: "credential already issued",
      id,
      issued_at: existing.issued_at,
      worker_id: existing.worker_id,
    });
  }

  const issued_at = new Date().toISOString();
  const record: IssuedRecord = {
    id,
    issued_at,
    worker_id: WORKER_ID,
    credential,
  };
  db[id] = record;
  saveDb(db);

  return res.status(201).json({
    message: `credential issued by ${WORKER_ID}`,
    id,
    issued_at,
    worker_id: WORKER_ID,
  });
});

app.listen(PORT, () => {
  console.log(`Issuer listening on http://localhost:${PORT} as ${WORKER_ID}`);
});
