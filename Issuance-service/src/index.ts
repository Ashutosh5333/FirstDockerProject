import dotenv from "dotenv";
dotenv.config(); // Load .env variables

import express from "express";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import Database from "better-sqlite3";
import os from "os";


// --- Config from environment variables ---
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const WORKER_ID = process.env.POD_NAME || os.hostname();
const DB_FILE = process.env.DB_FILE || "issued.db";

// --- Initialize SQLite DB ---
const db = new Database(DB_FILE);
db.prepare(`
  CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY,
    data TEXT,
    issued_at TEXT
  )
`).run();

// --- Initialize Express ---
const app = express();
app.use(bodyParser.json());

// --- Issue credential endpoint ---
app.post("/issue", (req: Request, res: Response) => {
  const credential = req.body;

  if (!credential || !credential.id) {
    return res.status(400).json({ error: "credential must include id" });
  }

  const id = String(credential.id);
  const exists = db.prepare("SELECT 1 FROM credentials WHERE id = ?").get(id);

  if (exists) {
    return res.json({ message: "already issued", worker: WORKER_ID });
  }

  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO credentials (id, data, issued_at) VALUES (?, ?, ?)"
  ).run(id, JSON.stringify(credential), now);

  return res.json({
    message: `credential issued by ${WORKER_ID}`,
    worker: WORKER_ID,
    issued_at: now,
  });
});

// --- Health check endpoint ---
app.get("/health", (_: Request, res: Response) => {
  res.json({ status: "ok", worker: WORKER_ID });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Issuance service listening on ${PORT}, worker ${WORKER_ID}`);
});

// Export app for testing
export { app };
