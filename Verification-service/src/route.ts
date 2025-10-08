import { Router } from "express";
import fs from "fs";
import path from "path";
import { computeCredentialId } from "./utils.js";
import { VerificationLog } from "./types.js";
import { loadLogs, saveLogs } from "./db.js";

const router = Router();
const WORKER_ID = process.env.WORKER_ID ?? "worker-1";

// Issued DB path (point to Issuance service DB)
const ISSUED_DB_PATH = process.env.ISSUED_DB_PATH ?? path.join(__dirname, "..", "..", "Issuance-service", "db", "issued.json");

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", worker_id: WORKER_ID });
});

// Verify credential
router.post("/verify", (req, res) => {
  const credential = req.body;
  const id = computeCredentialId(credential);

  // Read Issuance DB
  let issuedDb: Record<string, any> = {};
  if (fs.existsSync(ISSUED_DB_PATH)) {
    const raw = fs.readFileSync(ISSUED_DB_PATH, "utf8");
    if (raw.trim()) issuedDb = JSON.parse(raw);
  }

  const found = issuedDb[id];
  const verified_at = new Date().toISOString();
  const logs: VerificationLog[] = loadLogs();

  if (!found) {
    logs.push({ id, verified_at, verifier_worker_id: WORKER_ID, result: "invalid" });
    saveLogs(logs);
    return res.status(404).json({ valid: false, id, message: "credential not issued" });
  }

  logs.push({ id, verified_at, verifier_worker_id: WORKER_ID, result: "valid" });
  saveLogs(logs);

  return res.json({
    valid: true,
    id,
    issued_at: found.issued_at,
    issued_by_worker: found.worker_id,
    verifier_worker_id: WORKER_ID,
    verified_at,
  });
});

export default router;
