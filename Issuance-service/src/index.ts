import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import dotenv from "dotenv";
import router from "./route.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Parse JSON request bodies
app.use(express.json());

app.use("/", router)

const PORT = Number(process.env.ISSUANCE_PORT ?? 4001);
const WORKER_ID = String(process.env.WORKER_ID ?? "worker-1");


app.listen(PORT, () => {
  console.log(`Issuer listening on http://localhost:${PORT} as ${WORKER_ID}`);
});
