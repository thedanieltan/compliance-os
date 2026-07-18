import test from "node:test";
import assert from "node:assert/strict";
import { loadDomainPack } from "../packages/domain-pack-loader/src/index.js";

test("DPM domain pack loads with strict references", () => {
  const loaded = loadDomainPack("dpm", { root: process.cwd(), strict: true });
  assert.equal(loaded.manifest.id, "dpm");
  assert.equal(loaded.manifest.workflows.length, 3);
  assert.equal(loaded.manifest.tests.length, 1);
});
