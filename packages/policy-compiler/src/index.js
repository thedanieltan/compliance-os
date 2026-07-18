import { validatePolicyIrPackage } from "../../../policy-ir/lib/validate.js";
import { validatePredicateLeafTypes } from "../../../policy-ir/lib/rule-predicate.js";
import { EXECUTION_CLASSES } from "../../../execution-classes/lib/validate.js";
import { canonicalize } from "./canonical-json.js";
import { sha256Digest } from "./input-fingerprint.js";

export const COMPILED_POLICY_BUNDLE_KIND = "compiled_policy_bundle";
export const COMPILED_POLICY_BUNDLE_SCHEMA_VERSION = "compiled-policy-bundle.v1";

function compareStrings(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function computeCompiledBundleHash(bundle) {
  const { bundle_hash, ...payload } = bundle;
  return sha256Digest(payload);
}

export function verifyCompiledBundleHash(bundle) {
  return Boolean(bundle && typeof bundle.bundle_hash === "string" && computeCompiledBundleHash(bundle) === bundle.bundle_hash);
}

function fail(diagnostics) {
  return Object.freeze({
    ok: false,
    diagnostics: canonicalize([...diagnostics].sort((a, b) => compareStrings(JSON.stringify(a), JSON.stringify(b)))),
    bundle: null
  });
}

export function compilePolicyPackage(pkg) {
  const validation = validatePolicyIrPackage(pkg);
  if (!validation.ok) return fail(validation.errors.map((message) => ({ code: "POLICY_IR_INVALID", severity: "BLOCKING", message })));

  const byId = new Map(pkg.artifacts.map((artifact) => [artifact.artifact_id, artifact]));
  const diagnostics = validation.warnings.map((message) => ({ code: "POLICY_IR_WARNING", severity: "WARNING", message }));
  const plan = [];

  for (const rule of pkg.artifacts.filter((artifact) => artifact.artifact_type === "POLICY_RULE")) {
    const predicate = rule.body?.predicate;
    const executionClass = rule.body?.execution_class ?? "NON_EXECUTABLE_REFERENCE";
    if (!EXECUTION_CLASSES.has(executionClass)) diagnostics.push({ code: "EXECUTION_CLASS_INVALID", severity: "BLOCKING", message: `${rule.artifact_id}: unsupported execution class ${executionClass}` });
    if (predicate) {
      const typeErrors = validatePredicateLeafTypes(predicate, (factRef) => {
        const fact = byId.get(factRef);
        return fact?.artifact_type === "FACT_DEFINITION" ? fact.body : undefined;
      });
      for (const message of typeErrors) diagnostics.push({ code: "PREDICATE_TYPE_INVALID", severity: "BLOCKING", message: `${rule.artifact_id}: ${message}` });
    }
    const consumedFacts = (rule.references ?? [])
      .filter((reference) => reference.relation === "consumes")
      .map((reference) => reference.ref)
      .sort(compareStrings);
    for (const factRef of consumedFacts) {
      if (byId.get(factRef)?.artifact_type !== "FACT_DEFINITION") diagnostics.push({ code: "FACT_REFERENCE_INVALID", severity: "BLOCKING", message: `${rule.artifact_id}: ${factRef} is not a FACT_DEFINITION` });
    }
    plan.push(canonicalize({
      rule_ref: rule.artifact_id,
      execution_class: executionClass,
      predicate: predicate ?? null,
      consumed_fact_refs: consumedFacts,
      fact_definitions: Object.fromEntries(consumedFacts.map((ref) => [ref, byId.get(ref)?.body ?? null]))
    }));
  }

  if (diagnostics.some((entry) => entry.severity === "BLOCKING")) return fail(diagnostics);
  const payload = canonicalize({
    kind: COMPILED_POLICY_BUNDLE_KIND,
    schema_version: COMPILED_POLICY_BUNDLE_SCHEMA_VERSION,
    compiler: { name: "compliance-os.policy-compiler", version: "0.1.0" },
    package_manifest: pkg.package_manifest,
    canonical_artifacts: [...pkg.artifacts].sort((a, b) => compareStrings(a.artifact_id, b.artifact_id)),
    adapter_neutral_plan: plan.sort((a, b) => compareStrings(a.rule_ref, b.rule_ref)),
    diagnostics: diagnostics.sort((a, b) => compareStrings(JSON.stringify(a), JSON.stringify(b)))
  });
  const bundle = Object.freeze({ ...payload, bundle_hash: sha256Digest(payload) });
  return Object.freeze({ ok: true, diagnostics: bundle.diagnostics, bundle });
}
