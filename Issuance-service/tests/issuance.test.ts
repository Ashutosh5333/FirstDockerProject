import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import routes from "../src/route"
import { computeCredentialId, stableStringify } from "../src/util";

const app = express();
app.use(express.json());
app.use("/", routes);

// const TEST_DB_FILE = path.join(__dirname, "issued_test.json");
// 1️⃣ Set TEST_DB_FILE before importing your app or routes
process.env.TEST_DB_FILE = path.join(__dirname, "issued_test.json");


// 3️⃣ Cleanup test DB before and after tests
beforeEach(() => {
  const dbFile = process.env.TEST_DB_FILE;
  if (dbFile && fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});

afterAll(() => {
  const dbFile = process.env.TEST_DB_FILE;
  if (dbFile && fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
});


describe("Issuance Service", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("worker_id");
  });

  it("should issue a new credential", async () => {
    const credential = { name: "Alice", role: "Engineer" };
    const res = await request(app).post("/issue").send(credential);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", computeCredentialId(credential));
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("issued_at");
    expect(res.body).toHaveProperty("worker_id");
  });

  it("should not issue the same credential twice", async () => {
    const credential = { name: "Bob", role: "Tester" };
    await request(app).post("/issue").send(credential);
    const res2 = await request(app).post("/issue").send(credential);
    expect(res2.status).toBe(200);
    expect(res2.body).toHaveProperty("message", "credential already issued");
  });

  it("should get an issued credential by ID", async () => {
    const credential = { name: "Charlie", role: "DevOps" };
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
