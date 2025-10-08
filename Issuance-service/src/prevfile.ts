import express from "express";
import type { Request, Response } from "express";
import Database from "better-sqlite3";
import os from "os";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const VERIFICATION_URL = process.env.VERIFICATION_URL || "http://localhost:3002/verify";
const PORT = process.env.ISSUANCE_PORT ? Number(process.env.ISSUANCE_PORT) : 3001;
const WORKER_ID = process.env.POD_NAME_ISSUANCE || os.hostname();

// Use relative path inside container (will mount DB)
const db = new Database("issued.db");
db.prepare(`CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  data TEXT,
  issued_at TEXT
)`).run();

app.post("/issue", async (req, res) => {
  const credential = req.body;
  console.log("Raw body received =>", req.body);
  console.log("Headers =>", req.headers);
  console.log("credential=====>",credential)

  if (!credential.id) {
    return res.status(400).json({ error: "credential must include id" });
  }

  const issued_at = new Date().toISOString();
  const worker = os.hostname();

  try {
    // Call verification microservice
    const verifyRes = await axios.post("http://localhost:3002/verify", credential);

    res.json({
      issued_by: worker,
      issued_at,
      data: credential,
      verification: verifyRes.data
    });
  } catch (error) {
    res.json({
      issued_by: worker,
      issued_at,
      data: credential,
      verification: { error: "Verification service unavailable" }
    });
  }
});


// app.post("/issue", (req: Request, res: Response) => {
//   const credential = req.body;
//   if (!credential || !credential.id) {
//     return res.status(400).json({ error: "credential must include id" });
//   }

//   const id = String(credential.id);
//   const exists = db.prepare("SELECT 1 FROM credentials WHERE id = ?").get(id);

//   if (exists) return res.json({ message: "already issued", worker: WORKER_ID });

//   const now = new Date().toISOString();
//   db.prepare("INSERT INTO credentials (id, data, issued_at) VALUES (?, ?, ?)")
//     .run(id, JSON.stringify(credential), now);

//   return res.json({ message: `credential issued by ${WORKER_ID}`, worker: WORKER_ID, issued_at: now });
// });

app.get("/health", (_, res) => res.json({ status: "ok", worker: WORKER_ID }));


app.listen(PORT, () => console.log(`Issuance service running on ${PORT}`));
