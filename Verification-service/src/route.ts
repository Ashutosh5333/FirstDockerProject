import express from "express";
import { readJson, writeJson, VERIFICATION_LOG_FILE } from "./db.js";
import { computeCredentialId } from "./utils.js";
import { IssuedRecord, VerificationLog } from "./types.js";

const router = express.Router();
const WORKER_ID = process.env.WORKER_ID ?? "worker-1";

// For simplicity, point to issuer DB via env
const ISSUED_DB_PATH = process.env.ISSUED_DB_PATH!;

router.get("/health", (_req, res) => {
  res.json({ status: "ok", worker_id: WORKER_ID });
});

router.post("/verify", (req, res) => {
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

export default router;
