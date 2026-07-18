#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { validateDomainPackManifest } from "../packages/domain-pack-loader/src/index.js";

const strict = process.argv.includes("--strict-domain-packs");
const root = process.cwd();
const packsDir = path.resolve("domain-packs");
const packNames = fs.readdirSync(packsDir).filter((name) => fs.existsSync(path.join(packsDir, name, "manifest.json"))).sort();
let failed = false;
for (const name of packNames) {
  const manifest = JSON.parse(fs.readFileSync(path.join(packsDir, name, "manifest.json"), "utf8"));
  const result = validateDomainPackManifest(manifest, { rootDir: root, strict });
  if (!result.ok) {
    failed = true;
    console.error(`${name}:`);
    for (const error of result.errors) console.error(`  - ${error}`);
  } else {
    console.log(`ok ${name}`);
  }
}
if (failed) process.exitCode = 1;
