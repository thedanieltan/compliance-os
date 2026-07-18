export const BOUNDED_OUTCOMES = new Set([
  "PASS", "FAIL", "ALLOW", "DENY", "NOT_APPLICABLE", "INSUFFICIENT_INFORMATION",
  "EVIDENCE_GAP", "REQUIRES_REVIEW", "REQUIRE_APPROVAL", "REQUIRE_ATTESTATION",
  "HUMAN_DECISION_REQUIRED", "FACT_CONFLICT", "POLICY_CONFLICT",
  "NO_AUTHORITATIVE_DECISION", "PROHIBITED_AUTOMATION", "ERROR"
]);

export function validateEvaluationRequest(request) {
  const errors = [];
  if (!request || typeof request !== "object" || Array.isArray(request)) return { ok: false, errors: ["evaluation request must be an object"] };
  if (typeof request.evaluation_id !== "string" || !request.evaluation_id) errors.push("evaluation_id is required");
  if (typeof request.evaluated_at !== "string" || !request.evaluated_at) errors.push("evaluated_at is required");
  if (!request.facts || typeof request.facts !== "object" || Array.isArray(request.facts)) errors.push("facts must be an object");
  return { ok: errors.length === 0, errors };
}

export function validateDecision(decision) {
  const errors = [];
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) return { ok: false, errors: ["decision must be an object"] };
  if (decision.kind !== "policy_decision") errors.push("kind must be policy_decision");
  if (decision.schema_version !== "policy-decision.v1") errors.push("unsupported decision schema version");
  if (!Array.isArray(decision.results)) errors.push("results must be an array");
  for (const result of decision.results ?? []) if (!BOUNDED_OUTCOMES.has(result.outcome)) errors.push(`unbounded outcome ${JSON.stringify(result.outcome)}`);
  if (!Array.isArray(decision.proposed_effects)) errors.push("proposed_effects must be an array");
  if (typeof decision.decision_hash !== "string" || !decision.decision_hash) errors.push("decision_hash is required");
  return { ok: errors.length === 0, errors };
}
