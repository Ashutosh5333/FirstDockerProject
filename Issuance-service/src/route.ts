import { Router } from "express";
import { Credential, IssuedRecord, IssueResponse } from "./types.js";
import { computeCredentialId, loadDb, saveDb } from "./utils/loadDb.js";
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


router.post("/issue", (req, res) => {
  const credential: Credential = req.body;
  const id: string = computeCredentialId(credential);

  const db: Record<string, IssuedRecord> = loadDb();

  // ✅ Check if a credential with the same name & password already exists
  const duplicate: IssuedRecord | undefined = Object.values(db).find(
    (rec: any) =>
      rec.credential.name === credential.name &&
      rec.credential.password === credential.password
  );

  if (duplicate) {
    const response: IssueResponse = {
      message: "Credential with the same name and password already exists",
      id: duplicate.id,
      issued_at: duplicate.issued_at,
      worker_id: duplicate.worker_id,
    };
    return res.status(409).json(response);
  }

  // Check if credential ID already exists (full payload)
  const existing: IssuedRecord | undefined = db[id];
  if (existing) {
    const response: IssueResponse = {
      message: "Credential already issued",
      id,
      issued_at: existing.issued_at,
      worker_id: existing.worker_id,
    };
    return res.status(200).json(response);
  }

  const issued_at: string = new Date().toISOString();
  const record: IssuedRecord = { id, issued_at, worker_id: WORKER_ID, credential };
  db[id] = record;
  saveDb(db);

  const response: IssueResponse = {
    message: `Credential issued by ${WORKER_ID}`,
    id,
    issued_at,
    worker_id: WORKER_ID,
  };

  return res.status(201).json(response);
});



export default router;
