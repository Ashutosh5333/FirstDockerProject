import express from "express";
import path from "path";
import { IssuedRecord, VerificationLog } from "./types.js";
import { computeCredentialId } from "./utils/cryptoUtils.js";
import {
  readJson,
  writeJson,
  VERIFICATION_LOG_FILE,
} from "./utils/fileUtils.js";


const router = express.Router();
const WORKER_ID = process.env.WORKER_ID ?? "worker-1";

const ISSUED_DB_PATH = path.resolve(
  process.env.ISSUED_DB_PATH || "../Issuance-service/db/issued.json"
);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", worker_id: WORKER_ID });
});

router.post("/verify", (req, res) => {
  const credential = req.body;
  const id = computeCredentialId(credential);

  // ✅ Read the issued DB
  const issuedDb = readJson<Record<string, IssuedRecord>>(ISSUED_DB_PATH, {});
  // console.log("Verifying ID:", id);
  // console.log("Issued DB Path:", ISSUED_DB_PATH);
  // console.log("Issued DB Keys:", Object.keys(issuedDb));

  const verified_at = new Date().toISOString();
  const logs = readJson<VerificationLog[]>(VERIFICATION_LOG_FILE, []);

  if (!issuedDb[id]) {
    logs.push({
      id,
      verified_at,
      verifier_worker_id: WORKER_ID,
      result: "invalid",
    });
    writeJson(VERIFICATION_LOG_FILE, logs);

    return res
      .status(404)
      .json({ valid: false, id, message: "Credential not issued" });
  }

  const found = issuedDb[id];
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
