import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical-json.js";

export function sha256Digest(value) {
  return createHash("sha256").update(typeof value === "string" ? value : canonicalJson(value)).digest("hex");
}
