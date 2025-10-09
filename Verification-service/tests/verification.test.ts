import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";

import { computeCredentialId } from "../src/utils.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import router from "../src/route.js";

const app = express();
app.use(express.json());
app.use("/", router);


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_LOG_FILE = path.join(__dirname, "verifications_test.json");
const ISSUED_DB_FILE = path.join(__dirname, "issued_test.json");


process.env.ISSUED_DB_PATH = ISSUED_DB_FILE;
process.env.VERIFICATION_LOG_FILE = TEST_LOG_FILE;

// cleanup
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
    expect(res.body).toHaveProperty("worker_id");
  });

  it("should verify a valid credential", async () => {
    const credential = { name: "Alice", role: "Engineer" };
    const id = computeCredentialId(credential);

    // Add to issued DB
    fs.writeFileSync(ISSUED_DB_FILE, JSON.stringify({ [id]: { id, credential, issued_at: new Date().toISOString(), worker_id: "worker-1" } }));

    const res = await request(app).post("/verify").send(credential);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("valid", true);
    expect(res.body).toHaveProperty("id", id);
    expect(res.body).toHaveProperty("issued_at");
    expect(res.body).toHaveProperty("verifier_worker_id");
    expect(res.body).toHaveProperty("verified_at");
  });

  it("should return invalid for unknown credential", async () => {
    const credential = { name: "Bob", role: "Tester" };
    const res = await request(app).post("/verify").send(credential);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("valid", false);
    expect(res.body).toHaveProperty("message", "credential not issued");
  });
});
