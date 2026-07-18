import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validatePolicyIrPackage } from "../policy-ir/lib/validate.js";
import { compilePolicyPackage, verifyCompiledBundleHash } from "../packages/policy-compiler/src/index.js";
import { evaluateCompiledBundle } from "../packages/policy-evaluator/src/index.js";
import { validateDecision } from "../decision-effect/lib/validate.js";

function fixture() {
  return JSON.parse(fs.readFileSync(new URL("../policy-ir/examples/dpm-ropa-completeness-min.json", import.meta.url), "utf8"));
}
function evaluate(facts) {
  const compiled = compilePolicyPackage(fixture());
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  return evaluateCompiledBundle(compiled.bundle, {
    evaluation_id: "test:evaluation",
    evaluated_at: "2026-07-18T00:00:00Z",
    facts
  });
}

test("Policy IR package validates", () => {
  assert.equal(validatePolicyIrPackage(fixture()).ok, true);
});

test("compiler produces a content-addressed bundle", () => {
  const first = compilePolicyPackage(fixture());
  const second = compilePolicyPackage(fixture());
  assert.equal(first.ok, true);
  assert.equal(first.bundle.bundle_hash, second.bundle.bundle_hash);
  assert.equal(verifyCompiledBundleHash(first.bundle), true);
});

test("evaluator returns PASS for a satisfied deterministic rule", () => {
  const result = evaluate({ "dpm:fact.ropa-complete": true });
  assert.equal(result.ok, true);
  assert.equal(result.decision.results[0].outcome, "PASS");
  assert.equal(validateDecision(result.decision).ok, true);
});

test("evaluator returns FAIL for an unsatisfied deterministic rule", () => {
  assert.equal(evaluate({ "dpm:fact.ropa-complete": false }).decision.results[0].outcome, "FAIL");
});

test("missing required fact returns INSUFFICIENT_INFORMATION", () => {
  assert.equal(evaluate({}).decision.results[0].outcome, "INSUFFICIENT_INFORMATION");
});

test("tampered bundle fails closed", () => {
  const compiled = compilePolicyPackage(fixture());
  const tampered = { ...compiled.bundle, adapter_neutral_plan: [] };
  const result = evaluateCompiledBundle(tampered, {
    evaluation_id: "test:tamper",
    evaluated_at: "2026-07-18T00:00:00Z",
    facts: {}
  });
  assert.equal(result.ok, false);
  assert.equal(result.decision, null);
});

test("domain-specific top-level fields are rejected", () => {
  const document = fixture();
  document.artifacts[0].legal_basis = "consent";
  const result = validatePolicyIrPackage(document);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /unexpected top-level field/);
});
