import express from "express";
import type { Request, Response } from "express";
import Database from "better-sqlite3";
import os from "os";

import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json()); 

const PORT = process.env.VERIFICATION_PORT
  ? Number(process.env.VERIFICATION_PORT)
  : 3002;

const WORKER_ID = process.env.POD_NAME_VERIFICATION || os.hostname();

// Same DB as issuance, mounted via Docker volume
const db = new Database("issued.db");
// console.log("db=======> from verfification", db);

// ---------------------- Routes ----------------------

type CredentialRecord = {
  id: string;
  data: string;
  issued_at: string;
};

app.post("/verify", (req: Request, res: Response) => {
  const credential = req.body;
  
  if (!credential || !credential.id) {
    return res.status(400).json({ error: "credential must include id" });
  }

  const record = db
    .prepare("SELECT * FROM credentials WHERE id = ?")
    .get(String(credential.id)) as CredentialRecord | undefined;

  if (!record) {
    return res.json({ valid: false });
  }

  return res.json({
    valid: true,
    worker: WORKER_ID,
    issued_at: record.issued_at,
    data: JSON.parse(record.data),
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", worker: WORKER_ID });
});

// ---------------------- Start server ----------------------

app.listen(PORT, () => {
  console.log(`Verification service listening on ${PORT}, worker ${WORKER_ID}`);
});
