#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { validatePolicyIrPackage } from "../policy-ir/lib/validate.js";

const examplesDir = path.resolve("policy-ir/examples");
const files = fs.readdirSync(examplesDir).filter((file) => file.endsWith(".json")).sort();
let failed = false;
for (const file of files) {
  const document = JSON.parse(fs.readFileSync(path.join(examplesDir, file), "utf8"));
  const result = validatePolicyIrPackage(document);
  if (!result.ok) {
    failed = true;
    console.error(`${file}:`);
    for (const error of result.errors) console.error(`  - ${error}`);
  } else {
    console.log(`ok ${file}`);
  }
}
if (failed) process.exitCode = 1;
