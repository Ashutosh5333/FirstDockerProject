import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, "..", "db");
export const DATA_FILE =
  process.env.DATA_FILE ?? path.join(DB_DIR, "issued.json");

export function getDataFile() {
  return process.env.TEST_DB_FILE ?? DATA_FILE;
}
