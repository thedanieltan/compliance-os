import { validateRulePredicateStructure } from "./rule-predicate.js";

const ARTIFACT_TYPES = new Set([
  "POLICY_SOURCE", "AUTHORITY_REFERENCE", "INTERPRETATION", "FACT_DEFINITION",
  "OBLIGATION", "CONTROL", "EVIDENCE_CONTRACT", "POLICY_RULE",
  "APPROVAL_REQUIREMENT", "EXCEPTION_POLICY", "OVERRIDE_POLICY", "WORKFLOW_EFFECT",
  "DECISION_SCHEMA", "FRAMEWORK_MAPPING", "CONFLICT", "MIGRATION", "PACKAGE_MANIFEST"
]);
const STATUSES = new Set(["DRAFT", "PROPOSED", "ACTIVE", "SUPERSEDED", "DEPRECATED", "REVOKED"]);
const LICENSING_ORDER = { OPEN: 0, REFERENCE_ONLY: 1, RESTRICTED: 2 };
const ALLOWED_ARTIFACT_KEYS = new Set([
  "artifact_id", "artifact_type", "schema_version", "artifact_version", "status",
  "publisher_ref", "source_refs", "references", "provenance", "valid_from", "valid_to",
  "recorded_at", "superseded_at", "jurisdiction_refs", "scope_refs", "licensing",
  "content_hash", "body", "extensions"
]);

function namespaceOf(id) {
  return String(id).split(":")[0];
}
function allReferences(artifact) {
  return [...(artifact.source_refs ?? []), ...(artifact.references ?? [])];
}
function detectCycle(adjacency) {
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of adjacency.get(id) ?? []) if (visit(next)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  return [...adjacency.keys()].some(visit);
}

export function validatePolicyIrPackage(pkg) {
  const errors = [];
  const warnings = [];
  if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) return { ok: false, errors: ["package must be an object"], warnings };
  const manifest = pkg.package_manifest;
  if (!manifest || typeof manifest !== "object") errors.push("package_manifest is required");
  else {
    if (typeof manifest.package_id !== "string" || !manifest.package_id) errors.push("package_manifest.package_id is required");
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) errors.push("package_manifest.version must be semantic version");
    if (manifest.schema_version !== "policy-ir.v1") errors.push("package_manifest.schema_version must be policy-ir.v1");
  }
  if (!Array.isArray(pkg.artifacts)) return { ok: false, errors: [...errors, "artifacts must be an array"], warnings };

  const byId = new Map();
  for (const artifact of pkg.artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("artifact must be an object");
      continue;
    }
    for (const key of Object.keys(artifact)) if (!ALLOWED_ARTIFACT_KEYS.has(key)) errors.push(`${artifact.artifact_id ?? "artifact"}: unexpected top-level field ${JSON.stringify(key)}`);
    const required = ["artifact_id", "artifact_type", "schema_version", "artifact_version", "status", "publisher_ref", "source_refs", "provenance", "valid_from", "valid_to", "content_hash", "licensing"];
    for (const field of required) if (!(field in artifact)) errors.push(`${artifact.artifact_id ?? "artifact"}: missing ${field}`);
    if (typeof artifact.artifact_id !== "string" || !/^[a-z][a-z0-9._-]*:[A-Za-z0-9][A-Za-z0-9._-]*$/.test(artifact.artifact_id)) errors.push("artifact_id is invalid");
    if (byId.has(artifact.artifact_id)) errors.push(`duplicate artifact_id ${JSON.stringify(artifact.artifact_id)}`);
    byId.set(artifact.artifact_id, artifact);
    if (!ARTIFACT_TYPES.has(artifact.artifact_type)) errors.push(`${artifact.artifact_id}: unsupported artifact_type`);
    if (artifact.schema_version !== "policy-ir.v1") errors.push(`${artifact.artifact_id}: schema_version must be policy-ir.v1`);
    if (!STATUSES.has(artifact.status)) errors.push(`${artifact.artifact_id}: unsupported status`);
    if (!(artifact.licensing?.class in LICENSING_ORDER)) errors.push(`${artifact.artifact_id}: unsupported licensing class`);
    if (!Array.isArray(artifact.source_refs)) errors.push(`${artifact.artifact_id}: source_refs must be an array`);
    if (artifact.artifact_type === "POLICY_RULE" && artifact.body?.predicate !== undefined) {
      for (const error of validateRulePredicateStructure(artifact.body.predicate).errors) errors.push(`${artifact.artifact_id}: ${error}`);
    }
  }

  const dependencyNamespaces = new Set((manifest?.dependencies ?? []).map((dependency) => dependency.package));
  const adjacency = new Map([...byId.keys()].map((id) => [id, []]));
  for (const artifact of pkg.artifacts) {
    if (!artifact?.artifact_id) continue;
    for (const reference of allReferences(artifact)) {
      if (!reference || typeof reference.ref !== "string") continue;
      const target = byId.get(reference.ref);
      if (target) adjacency.get(artifact.artifact_id).push(reference.ref);
      else if (!dependencyNamespaces.has(namespaceOf(reference.ref))) {
        const message = `${artifact.artifact_id} references unresolved ${reference.ref}`;
        if (reference.required === true) errors.push(message); else warnings.push(message);
      }
      if (target && LICENSING_ORDER[artifact.licensing?.class] < LICENSING_ORDER[target.licensing?.class]) {
        errors.push(`${artifact.artifact_id}: reference to stricter licensed artifact ${reference.ref}`);
      }
    }
  }
  if (detectCycle(adjacency)) errors.push("reference cycle detected");
  return { ok: errors.length === 0, errors, warnings };
}
