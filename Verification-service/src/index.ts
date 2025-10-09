import express from "express";
import router from "./route.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.VERIFICATION_PORT ?? 3002);

const WORKER_ID = String(process.env.WORKER_ID ?? "worker-1");
app.use("/", router);


app.listen(PORT, () => {
  console.log(`Verifier listening on http://localhost:${PORT} as ${WORKER_ID}`);
});
