#!/usr/bin/env node
import { discoverDomainPacks, loadDomainPack } from "../packages/domain-pack-loader/src/index.js";
const root = process.cwd();
const strict = process.argv.includes("--strict-domain-packs");
let failed = false;
for (const pack of discoverDomainPacks({ root }).packs) {
  try { loadDomainPack(pack.id, { root, strict }); console.log(`ok ${pack.id}`); }
  catch (error) { failed = true; console.error(`${pack.id}: ${error.message}`); }
}
if (failed) process.exitCode = 1;
