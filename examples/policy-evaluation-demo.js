import fs from "node:fs";
import { compilePolicyPackage } from "../packages/policy-compiler/src/index.js";
import { evaluateCompiledBundle } from "../packages/policy-evaluator/src/index.js";

const policyPackage = JSON.parse(fs.readFileSync(new URL("../policy-ir/examples/dpm-ropa-completeness-min.json", import.meta.url), "utf8"));
const compiled = compilePolicyPackage(policyPackage);
if (!compiled.ok) throw new Error(JSON.stringify(compiled.diagnostics, null, 2));
const evaluated = evaluateCompiledBundle(compiled.bundle, {
  evaluation_id: "demo:dpm-ropa-completeness",
  evaluated_at: "2026-07-18T00:00:00Z",
  facts: { "dpm:fact.ropa-complete": true }
});
console.log(JSON.stringify(evaluated.decision, null, 2));
