export const APPROVAL_RECORD_TYPES = Object.freeze(["decision", "approval", "rejection", "exception", "waiver", "override", "attestation", "delegation", "review", "sign_off"]);
export const APPROVAL_STATUSES = Object.freeze(["draft", "requested", "in_review", "approved", "rejected", "revoked", "expired", "superseded", "cancelled"]);
export const DECISION_OUTCOMES = Object.freeze(["approved", "rejected", "accepted_risk", "requires_changes", "deferred", "not_applicable", "superseded"]);
export const APPROVER_TYPES = Object.freeze(["human", "role", "committee", "service", "system"]);
export const AUTHORITY_BASIS_TYPES = Object.freeze(["role", "delegation", "policy", "system_rule", "committee_charter", "manual_assignment"]);
export const APPROVAL_GUARDRAILS = Object.freeze(["requires_human_approval", "requires_dual_control", "requires_evidence", "requires_reason", "requires_expiry", "requires_scope", "requires_audit_event", "cannot_self_approve", "cannot_auto_approve"]);
export const NON_OVERRIDABLE_APPROVAL_INVARIANTS = Object.freeze(["cannot_self_approve", "cannot_auto_approve", "requires_dual_control", "requires_audit_event"]);
const DECIDED = new Set(["approved", "rejected", "revoked", "expired", "superseded"]);
const refs = (value) => Object.freeze([...new Set((value ?? []).filter(Boolean))]);
function assertEnum(value, allowed, label) { if (!allowed.includes(value)) throw new Error(`invalid ${label}: ${value}`); }
function approver(value = {}) { assertEnum(value.approverType ?? "human", APPROVER_TYPES, "approver type"); assertEnum(value.authorityBasis ?? "role", AUTHORITY_BASIS_TYPES, "authority basis"); return Object.freeze({ approverId: value.approverId ?? null, approverType: value.approverType ?? "human", approverRole: value.approverRole ?? null, authorityBasis: value.authorityBasis ?? "role", authorityRef: value.authorityRef ?? null, additionalApprovers: undefined }); }
function allApprovers(record) { return [record.authority, ...(record.authority.additionalApprovers ?? [])]; }

export function createApprovalScope(scope = {}) {
  return Object.freeze({ workspaceId: scope.workspaceId ?? "default", requirementRefs: refs(scope.requirementRefs), obligationRefs: refs(scope.obligationRefs), controlRefs: refs(scope.controlRefs), evidenceRefs: refs(scope.evidenceRefs), riskRefs: refs(scope.riskRefs), issueRefs: refs(scope.issueRefs), graphNodeRefs: refs(scope.graphNodeRefs), graphEdgeRefs: refs(scope.graphEdgeRefs), domainPackRefs: refs(scope.domainPackRefs) });
}
export function createAuthorityContext(value = {}) {
  const primary = approver(value);
  return Object.freeze({ ...primary, additionalApprovers: Object.freeze((value.additionalApprovers ?? []).map(approver)) });
}
export function validateApprovalRecord(record) {
  if (!record?.id) throw new Error("approval record id is required");
  assertEnum(record.recordType, APPROVAL_RECORD_TYPES, "approval record type");
  assertEnum(record.status, APPROVAL_STATUSES, "approval status");
  for (const guardrail of record.guardrails ?? []) assertEnum(guardrail, APPROVAL_GUARDRAILS, "approval guardrail");
  if (JSON.stringify(record.nonOverridableInvariants) !== JSON.stringify(NON_OVERRIDABLE_APPROVAL_INVARIANTS)) throw new Error("approval non-overridable invariant set is fixed by the substrate");
  const scopeCount = Object.entries(record.scope).filter(([key, value]) => key.endsWith("Refs") && Array.isArray(value)).reduce((sum, [, value]) => sum + value.length, 0);
  if (!record.scope.workspaceId || scopeCount === 0) throw new Error("approval record must be scoped to at least one compliance object");
  const approvers = allApprovers(record);
  const ids = approvers.map((item) => item.approverId).filter(Boolean);
  if (new Set(ids).size !== ids.length) throw new Error("approval authority approvers must be distinct");
  if (record.requestedBy && record.guardrails.includes("cannot_self_approve") && ids.includes(record.requestedBy)) throw new Error("approval record violates cannot_self_approve guardrail");
  if (DECIDED.has(record.status)) {
    if (approvers.some((item) => !item.approverId)) throw new Error("approval authority approverId is required");
    if (record.guardrails.includes("requires_dual_control") && approvers.length < 2) throw new Error("approval record requires two distinct approvers");
    if (record.guardrails.includes("cannot_auto_approve") && approvers.some((item) => ["service", "system"].includes(item.approverType))) throw new Error("approval record violates cannot_auto_approve guardrail");
    if (record.guardrails.includes("requires_human_approval") && approvers.some((item) => item.approverType !== "human")) throw new Error("approval record requires a human approver");
    if (record.guardrails.includes("requires_audit_event") && record.lifecycle.auditEventRefs.length === 0) throw new Error("approval record requires an audit event reference at decision time");
  }
  if (record.guardrails.includes("requires_reason") && !record.reason && !record.rationale) throw new Error("approval record requires reason or rationale");
  if (record.guardrails.includes("requires_evidence") && record.inputs.evidenceRefs.length === 0) throw new Error("approval record requires evidence input");
  if (record.guardrails.includes("requires_expiry") && !record.validity.expiresAt && !record.validity.effectiveUntil) throw new Error("approval record requires expiry");
  return true;
}
export function createApprovalRecord(input = {}) {
  const createdAt = input.lifecycle?.createdAt ?? input.createdAt ?? new Date().toISOString();
  const record = Object.freeze({
    id: input.id, recordType: input.recordType ?? "approval", workspaceId: input.workspaceId ?? input.scope?.workspaceId ?? "default", requestedBy: input.requestedBy ?? null, subjectType: input.subjectType ?? "graph_node", subjectRef: input.subjectRef ?? null,
    status: input.status ?? "requested", outcome: input.outcome ?? null, effect: input.effect ?? "records_accountability", reason: input.reason ?? null, rationale: input.rationale ?? null,
    authority: createAuthorityContext(input.authority), scope: createApprovalScope({ ...(input.scope ?? {}), workspaceId: input.workspaceId ?? input.scope?.workspaceId ?? "default" }),
    inputs: Object.freeze({ evidenceRefs: refs(input.inputs?.evidenceRefs), compilerArtifactRefs: refs(input.inputs?.compilerArtifactRefs), policyRefs: refs(input.inputs?.policyRefs) }),
    guardrails: refs(input.guardrails), nonOverridableInvariants: NON_OVERRIDABLE_APPROVAL_INVARIANTS,
    validity: Object.freeze({ effectiveFrom: input.validity?.effectiveFrom ?? input.lifecycle?.decidedAt ?? null, effectiveUntil: input.validity?.effectiveUntil ?? null, expiresAt: input.validity?.expiresAt ?? null }),
    lifecycle: Object.freeze({ createdAt, updatedAt: input.lifecycle?.updatedAt ?? createdAt, decidedAt: input.lifecycle?.decidedAt ?? null, auditEventRefs: refs(input.lifecycle?.auditEventRefs) })
  });
  validateApprovalRecord(record);
  return record;
}
export function decideApproval(record, decision = {}) { const decidedAt = decision.decidedAt ?? new Date().toISOString(); return createApprovalRecord({ ...record, status: ["approved", "accepted_risk"].includes(decision.outcome ?? "approved") ? "approved" : "rejected", outcome: decision.outcome ?? "approved", reason: decision.reason ?? record.reason, authority: decision.authority ?? record.authority, lifecycle: { ...record.lifecycle, decidedAt, updatedAt: decidedAt, auditEventRefs: [...record.lifecycle.auditEventRefs, ...(decision.auditEventRefs ?? [])] } }); }
export function createDelegationRecord(input = {}) { if (!input.id || !input.delegatedBy || !input.delegatedTo) throw new Error("delegation identity is required"); if (input.delegatedBy === input.delegatedTo) throw new Error("delegation delegatedBy and delegatedTo must differ"); if (!input.effectiveFrom || !input.effectiveUntil || Date.parse(input.effectiveFrom) >= Date.parse(input.effectiveUntil)) throw new Error("delegation effectiveFrom must precede effectiveUntil"); const scope = createApprovalScope(input.scope); const count = Object.entries(scope).filter(([key, value]) => key.endsWith("Refs") && Array.isArray(value)).reduce((sum, [, value]) => sum + value.length, 0); if (!count) throw new Error("delegation must be scoped"); return Object.freeze({ id: input.id, recordType: "delegation", workspaceId: scope.workspaceId, delegatedBy: input.delegatedBy, delegatedTo: input.delegatedTo, delegatedRole: input.delegatedRole ?? null, scope, effectiveFrom: input.effectiveFrom, effectiveUntil: input.effectiveUntil, status: input.status ?? "approved", reason: input.reason ?? null }); }
export function approvalGraphEdges(record) { validateApprovalRecord(record); return Object.freeze(allApprovers(record).filter((item) => item.approverId).map((item) => Object.freeze({ id: `${record.id}:approved_by:${item.approverId}`, type: "approved_by", from: record.id, to: item.approverId }))); }
