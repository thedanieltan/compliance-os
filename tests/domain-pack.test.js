import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadDomainPack } from "../packages/domain-pack-loader/src/index.js";

test("DPM domain pack loads with strict references", () => {
  const manifest = loadDomainPack(path.resolve("domain-packs/dpm"), { rootDir: process.cwd(), strict: true });
  assert.equal(manifest.id, "dpm");
  assert.equal(manifest.workflows.length, 1);
  assert.equal(manifest.tests.length, 1);
});
