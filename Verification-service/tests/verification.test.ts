import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const TEST_LOG_FILE = path.join(__dirname, "verifications_test.json");
const ISSUED_DB_FILE = path.join(__dirname, "issued_test.json");

process.env.ISSUED_DB_PATH = ISSUED_DB_FILE;
process.env.VERIFICATION_LOG_FILE = TEST_LOG_FILE;

const ISSUED_DB_PATH =
  process.env.ISSUED_DB_PATH || "../../Issuance-service/db/issued.json";

import router from "../src/route.js";
import { computeCredentialId } from "../src/utils/cryptoUtils.js";
import { readJson } from "../src/utils/fileUtils.js";
import { IssuedRecord } from "../src/types.js";
const app = express();
app.use(express.json());
app.use("/", router);

beforeEach(() => {
  if (fs.existsSync(TEST_LOG_FILE)) fs.unlinkSync(TEST_LOG_FILE);
  if (fs.existsSync(ISSUED_DB_FILE)) fs.unlinkSync(ISSUED_DB_FILE);
});
afterAll(() => {
  if (fs.existsSync(TEST_LOG_FILE)) fs.unlinkSync(TEST_LOG_FILE);
  if (fs.existsSync(ISSUED_DB_FILE)) fs.unlinkSync(ISSUED_DB_FILE);
});

describe("Verification Service", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });

  it("should verify a valid credential", async () => {
    const credential = {
      name: "Ashutosh Lakshakar",
      role: "Software Engineer",
      issued_for: "Onboarding",
      expiry: "2026-10-07",
    };

    const id = computeCredentialId(credential);

    fs.writeFileSync(
      ISSUED_DB_FILE,
      JSON.stringify({
        [id]: {
          id,
          credential,
          issued_at: new Date().toISOString(),
          worker_id: "worker-1",
        },
      })
    );

    const res = await request(app).post("/verify").send(credential);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it("should return invalid for unknown credential", async () => {
    const credential = { name: "Bob", role: "Tester" };
    const res = await request(app).post("/verify").send(credential);
    expect(res.status).toBe(404);
    expect(res.body.valid).toBe(false);
  });
});
