import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import routes from "../src/route.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { computeCredentialId, stableStringify } from "../src/utils/loadDb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use("/", routes);

// ✅ Use a separate test DB file
const TEST_DB_FILE = path.join(__dirname, "issued_test.json");
process.env.TEST_DB_FILE = TEST_DB_FILE;

// 3️⃣ Cleanup test DB before and after tests
beforeEach(() => {
  if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
});

describe("Issuance Service", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("worker_id");
  });

  it("should issue a new credential", async () => {
    const credential = { name: "Alice", password: "1234", role: "Engineer" };
    const res = await request(app).post("/issue").send(credential);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", computeCredentialId(credential));
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("issued_at");
    expect(res.body).toHaveProperty("worker_id");
  });

  it("should not issue the same credential twice (full payload)", async () => {
    const credential = { name: "Bob", password: "abcd", role: "Tester" };
  
    await request(app).post("/issue").send(credential);
  
    const res2 = await request(app).post("/issue").send(credential);
  
    expect(res2.status).toBe(409);
    expect(res2.body).toHaveProperty(
      "message",
      "Credential with the same name and password already exists"
    );
  });
  

  it("should not issue duplicate based on name & password", async () => {
    const credential1 = { name: "Charlie", password: "xyz", role: "DevOps" };
    const credential2 = { name: "Charlie", password: "xyz", role: "Engineer" }; // same name & password
    await request(app).post("/issue").send(credential1);
    const res2 = await request(app).post("/issue").send(credential2);
    expect(res2.status).toBe(409); // conflict
    expect(res2.body).toHaveProperty(
      "message",
      "Credential with the same name and password already exists"
    );
  });

  it("should get an issued credential by ID", async () => {
    const credential = { name: "Eve", password: "pass123", role: "Designer" };
    const issueRes = await request(app).post("/issue").send(credential);
    const id = issueRes.body.id;

    const getRes = await request(app).get(`/issued/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty("id", id);
    expect(getRes.body.credential).toEqual(credential);
  });

  it("should return 404 for unknown credential ID", async () => {
    const getRes = await request(app).get(`/issued/nonexistentid`);
    expect(getRes.status).toBe(404);
    expect(getRes.body).toHaveProperty("error", "not found");
  });

  it("stableStringify should produce consistent output", () => {
    const obj = { b: 2, a: 1 };
    const str = stableStringify(obj);
    expect(str).toBe('{"a":1,"b":2}');
  });
});
