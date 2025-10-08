import { Router } from "express";
import { computeCredentialId } from "./util.js";
import { IssuedRecord } from "./types.js";
import { loadDb, saveDb } from "./utils/loadDb.js";


const router = Router();
const WORKER_ID = process.env.WORKER_ID ?? "worker-1";

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", worker_id: WORKER_ID });
});

// Get issued credential by ID
router.get("/issued/:id", (req, res) => {
  const id = req.params.id;
  const db = loadDb();
  const rec = db[id];
  if (!rec) return res.status(404).json({ error: "not found", id });
  return res.json(rec);
});

// Issue a new credential
router.post("/issue", (req, res) => {
  const credential = req.body;
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
  const record: IssuedRecord = { id, issued_at, worker_id: WORKER_ID, credential };
  db[id] = record;
  saveDb(db);

  return res.status(201).json({
    message: `credential issued by ${WORKER_ID}`,
    id,
    issued_at,
    worker_id: WORKER_ID,
  });
});

export default router;
