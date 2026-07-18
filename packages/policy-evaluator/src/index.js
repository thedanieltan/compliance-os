import { canonicalize } from "../../policy-compiler/src/canonical-json.js";
import { sha256Digest } from "../../policy-compiler/src/input-fingerprint.js";
import { verifyCompiledBundleHash } from "../../policy-compiler/src/index.js";
import { validateEvaluationRequest } from "../../../decision-effect/lib/validate.js";
import { predicateValueMatchesType } from "../../../policy-ir/lib/rule-predicate.js";

function hasFact(facts, ref) {
  return Object.prototype.hasOwnProperty.call(facts, ref);
}

function compare(left, right, operator) {
  switch (operator) {
    case "EQUALS": return left === right;
    case "NOT_EQUALS": return left !== right;
    case "GREATER_THAN": return left > right;
    case "GREATER_THAN_OR_EQUAL": return left >= right;
    case "LESS_THAN": return left < right;
    case "LESS_THAN_OR_EQUAL": return left <= right;
    case "IN": return right.includes(left);
    case "NOT_IN": return !right.includes(left);
    default: return null;
  }
}

function evaluateNode(node, facts, definitions) {
  if (node.all_of) {
    const results = node.all_of.map((child) => evaluateNode(child, facts, definitions));
    if (results.includes(false)) return false;
    return results.includes(null) ? null : true;
  }
  if (node.any_of) {
    const results = node.any_of.map((child) => evaluateNode(child, facts, definitions));
    if (results.includes(true)) return true;
    return results.includes(null) ? null : false;
  }
  if (node.not) {
    const result = evaluateNode(node.not, facts, definitions);
    return result === null ? null : !result;
  }
  const present = hasFact(facts, node.fact);
  if (node.operator === "IS_PRESENT") return present;
  if (node.operator === "IS_ABSENT") return !present;
  if (!present) return null;
  const value = facts[node.fact];
  if (node.operator === "IS_NULL") return value === null;
  if (node.operator === "IS_NOT_NULL") return value !== null;
  if (value === null) return null;
  if (node.operator === "IS_TRUE") return value === true;
  if (node.operator === "IS_FALSE") return value === false;
  const definition = definitions[node.fact];
  if (!definition || !predicateValueMatchesType(value, definition.value_type, definition.enum_values)) return null;
  return compare(value, node.value, node.operator);
}

function outcomeFor(entry, facts) {
  if (entry.execution_class === "PROHIBITED_AUTOMATION") return "PROHIBITED_AUTOMATION";
  if (entry.execution_class === "HUMAN_DECISION_REQUIRED") return "HUMAN_DECISION_REQUIRED";
  if (entry.execution_class === "ATTESTATION_REQUIRED") return "REQUIRE_ATTESTATION";
  if (entry.execution_class === "DETERMINISTIC_WITH_APPROVAL") return "REQUIRE_APPROVAL";
  if (entry.execution_class !== "DETERMINISTIC" || !entry.predicate) return "NO_AUTHORITATIVE_DECISION";
  const applicability = entry.predicate.applicability == null ? true : evaluateNode(entry.predicate.applicability, facts, entry.fact_definitions);
  if (applicability === false) return "NOT_APPLICABLE";
  if (applicability === null) return "INSUFFICIENT_INFORMATION";
  const assertion = evaluateNode(entry.predicate.assertion, facts, entry.fact_definitions);
  if (assertion === null) return "INSUFFICIENT_INFORMATION";
  return assertion ? "PASS" : "FAIL";
}

export function evaluateCompiledBundle(bundle, request) {
  const requestValidation = validateEvaluationRequest(request);
  if (!requestValidation.ok) return { ok: false, diagnostics: requestValidation.errors, decision: null };
  if (!verifyCompiledBundleHash(bundle)) return { ok: false, diagnostics: ["compiled bundle hash verification failed"], decision: null };
  const results = bundle.adapter_neutral_plan.map((entry) => ({ rule_ref: entry.rule_ref, outcome: outcomeFor(entry, request.facts) }));
  const payload = canonicalize({
    kind: "policy_decision",
    schema_version: "policy-decision.v1",
    decision_id: request.evaluation_id,
    evaluated_at: request.evaluated_at,
    bundle_hash: bundle.bundle_hash,
    results,
    proposed_effects: []
  });
  const decision = Object.freeze({ ...payload, decision_hash: sha256Digest(payload) });
  return Object.freeze({ ok: true, diagnostics: [], decision });
}
