export const COMPLIANCE_OBJECT_TYPES = Object.freeze(["requirement", "obligation", "assessment", "finding", "remediation"]);
export const COMPLIANCE_OBJECT_STATES = Object.freeze(["draft", "active", "closed", "superseded", "cancelled"]);

const TOP_LEVEL = new Set(["id", "recordType", "schemaVersion", "workspaceId", "title", "description", "state", "scope", "subjectRefs", "relationships", "ownership", "provenance", "lifecycle", "extensions"]);
const RELATIONSHIPS = Object.freeze(["requirementRefs", "obligationRefs", "controlRefs", "assessmentRefs", "findingRefs", "remediationRefs", "evidenceRefs", "riskRefs", "policyRefs", "procedureRefs", "systemRefs", "processRefs", "vendorRefs", "observationRefs", "testRefs"]);
const OWNERSHIP = Object.freeze(["ownerRefs", "accountableRefs", "assigneeRefs"]);
const TRANSITIONS = Object.freeze({ draft: ["active", "cancelled"], active: ["closed", "superseded", "cancelled"], closed: ["superseded"], superseded: [], cancelled: [] });

const refs = (value) => Object.freeze([...new Set((value ?? []).filter((item) => typeof item === "string" && item.length > 0))]);
function assertEnum(value, allowed, label) { if (!allowed.includes(value)) throw new Error(`invalid ${label}: ${value}`); }
function assertTime(value, label, required = false) {
  if (value == null) { if (required) throw new Error(`${label} is required`); return; }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an RFC3339 UTC timestamp`);
}
function assertTopLevel(input) { for (const key of Object.keys(input)) if (!TOP_LEVEL.has(key)) throw new Error(`unknown compliance object field: ${key}; use a namespaced extension for domain-specific data`); }
function assertExtensions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("compliance object extensions must be an object");
  for (const key of Object.keys(value)) if (!/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/.test(key)) throw new Error(`compliance object extension key must be namespaced: ${key}`);
}
function makeRelationships(value = {}) { return Object.freeze(Object.fromEntries(RELATIONSHIPS.map((key) => [key, refs(value[key])]))); }
function makeOwnership(value = {}) { return Object.freeze(Object.fromEntries(OWNERSHIP.map((key) => [key, refs(value[key])]))); }
function hasRef(record, fields) { return fields.some((field) => record.relationships[field].length > 0); }

export function validateComplianceObject(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("compliance object must be an object");
  assertTopLevel(record);
  if (!record.id) throw new Error("compliance object id is required");
  if (!record.workspaceId) throw new Error("compliance object workspaceId is required");
  if (!record.title) throw new Error("compliance object title is required");
  assertEnum(record.recordType, COMPLIANCE_OBJECT_TYPES, "compliance object type");
  assertEnum(record.state, COMPLIANCE_OBJECT_STATES, "compliance object state");
  if (record.schemaVersion !== "1.0.0") throw new Error("compliance object schemaVersion must be 1.0.0");
  if (record.scope?.workspaceId !== record.workspaceId) throw new Error("compliance object scope workspaceId must match workspaceId");
  if (!Array.isArray(record.subjectRefs) || record.subjectRefs.length === 0) throw new Error("compliance object must identify at least one subject");
  for (const field of RELATIONSHIPS) if (!Array.isArray(record.relationships?.[field])) throw new Error(`compliance object relationships ${field} must be an array`);
  for (const field of OWNERSHIP) if (!Array.isArray(record.ownership?.[field])) throw new Error(`compliance object ownership ${field} must be an array`);
  assertTime(record.scope?.periodStart, "compliance object periodStart");
  assertTime(record.scope?.periodEnd, "compliance object periodEnd");
  if (record.scope.periodStart && record.scope.periodEnd && Date.parse(record.scope.periodStart) >= Date.parse(record.scope.periodEnd)) throw new Error("compliance object periodStart must precede periodEnd");
  assertTime(record.provenance?.recordedAt, "compliance object provenance recordedAt", true);
  if (["requirement", "obligation"].includes(record.recordType) && record.provenance.sourceRefs.length === 0) throw new Error(`${record.recordType} must reference at least one authoritative or originating source`);
  if (record.recordType === "finding" && record.provenance.sourceRefs.length === 0 && !hasRef(record, ["assessmentRefs", "evidenceRefs", "observationRefs", "testRefs"])) throw new Error("finding must trace to an assessment, evidence, observation, test, or source");
  if (record.recordType === "remediation" && !hasRef(record, ["findingRefs", "riskRefs", "obligationRefs", "requirementRefs", "controlRefs"])) throw new Error("remediation must target a finding, risk, obligation, requirement, or control");
  assertTime(record.lifecycle?.createdAt, "compliance object lifecycle createdAt", true);
  assertTime(record.lifecycle?.updatedAt, "compliance object lifecycle updatedAt", true);
  assertTime(record.lifecycle?.closedAt, "compliance object lifecycle closedAt");
  if (!Number.isInteger(record.lifecycle?.version) || record.lifecycle.version < 1) throw new Error("compliance object lifecycle version must be a positive integer");
  if (record.state === "closed" && !record.lifecycle.closedAt) throw new Error("closed compliance object requires lifecycle closedAt");
  if (record.state === "superseded" && !record.lifecycle.supersededBy) throw new Error("superseded compliance object requires lifecycle supersededBy");
  assertExtensions(record.extensions);
  return true;
}

export function createComplianceObject(input = {}) {
  assertTopLevel(input);
  assertEnum(input.recordType, COMPLIANCE_OBJECT_TYPES, "compliance object type");
  const workspaceId = input.workspaceId ?? input.scope?.workspaceId;
  if (!workspaceId) throw new Error("compliance object workspaceId is required");
  const createdAt = input.lifecycle?.createdAt ?? input.provenance?.recordedAt;
  assertTime(createdAt, "compliance object createdAt", true);
  const record = Object.freeze({
    id: input.id,
    recordType: input.recordType,
    schemaVersion: "1.0.0",
    workspaceId,
    title: input.title ?? input.id,
    description: input.description ?? null,
    state: input.state ?? "draft",
    scope: Object.freeze({ workspaceId, tenantId: input.scope?.tenantId ?? null, entityRefs: refs(input.scope?.entityRefs), jurisdictionRefs: refs(input.scope?.jurisdictionRefs), domainPackRefs: refs(input.scope?.domainPackRefs), frameworkRefs: refs(input.scope?.frameworkRefs), periodStart: input.scope?.periodStart ?? null, periodEnd: input.scope?.periodEnd ?? null }),
    subjectRefs: refs(input.subjectRefs),
    relationships: makeRelationships(input.relationships),
    ownership: makeOwnership(input.ownership),
    provenance: Object.freeze({ sourceRefs: refs(input.provenance?.sourceRefs), derivedFromRefs: refs(input.provenance?.derivedFromRefs), producedByRef: input.provenance?.producedByRef ?? null, methodRef: input.provenance?.methodRef ?? null, recordedAt: input.provenance?.recordedAt ?? null }),
    lifecycle: Object.freeze({ createdAt, updatedAt: input.lifecycle?.updatedAt ?? createdAt, closedAt: input.lifecycle?.closedAt ?? null, supersededBy: input.lifecycle?.supersededBy ?? null, version: input.lifecycle?.version ?? 1, changeReason: input.lifecycle?.changeReason ?? "initial_record" }),
    extensions: Object.freeze({ ...(input.extensions ?? {}) })
  });
  validateComplianceObject(record);
  return record;
}

export const createRequirementRecord = (input = {}) => createComplianceObject({ ...input, recordType: "requirement" });
export const createObligationRecord = (input = {}) => createComplianceObject({ ...input, recordType: "obligation" });
export const createAssessmentRecord = (input = {}) => createComplianceObject({ ...input, recordType: "assessment" });
export const createFindingRecord = (input = {}) => createComplianceObject({ ...input, recordType: "finding" });
export const createRemediationRecord = (input = {}) => createComplianceObject({ ...input, recordType: "remediation" });

export function transitionComplianceObject(record, transition = {}) {
  validateComplianceObject(record);
  if (!TRANSITIONS[record.state].includes(transition.state)) throw new Error(`invalid compliance object transition: ${record.state} -> ${transition.state}`);
  assertTime(transition.updatedAt, "compliance object transition updatedAt", true);
  if (Date.parse(transition.updatedAt) < Date.parse(record.lifecycle.updatedAt)) throw new Error("compliance object transition updatedAt cannot precede the current updatedAt");
  const next = Object.freeze({ ...record, state: transition.state, lifecycle: Object.freeze({ ...record.lifecycle, updatedAt: transition.updatedAt, closedAt: transition.state === "closed" ? transition.updatedAt : record.lifecycle.closedAt, supersededBy: transition.state === "superseded" ? transition.supersededBy ?? null : record.lifecycle.supersededBy, version: record.lifecycle.version + 1, changeReason: transition.changeReason ?? `state_${transition.state}` }) });
  validateComplianceObject(next);
  return next;
}

export function complianceObjectGraphNode(record) { validateComplianceObject(record); return Object.freeze({ id: record.id, type: record.recordType, category: ["requirement", "obligation"].includes(record.recordType) ? "regulatory" : ["assessment", "finding"].includes(record.recordType) ? "assurance" : "risk", workspaceId: record.workspaceId, title: record.title, state: record.state }); }
export function complianceObjectGraphEdges(record) {
  validateComplianceObject(record);
  const edges = [];
  const add = (type, from, to) => edges.push(Object.freeze({ id: `${record.id}:${type}:${to}`, type, from, to }));
  for (const ref of record.subjectRefs) add("applies_to", record.id, ref);
  for (const ref of record.relationships.requirementRefs) add(record.recordType === "obligation" ? "required_by" : "maps_to", record.id, ref);
  for (const ref of record.relationships.obligationRefs) add("maps_to", record.id, ref);
  for (const ref of record.relationships.controlRefs) add("maps_to", record.id, ref);
  for (const ref of record.relationships.assessmentRefs) add("assessed_by", record.id, ref);
  for (const ref of record.relationships.findingRefs) add(record.recordType === "remediation" ? "remediates" : "related_to", record.id, ref);
  for (const ref of record.relationships.evidenceRefs) add("evidences", ref, record.id);
  for (const ref of record.relationships.riskRefs) add(record.recordType === "remediation" ? "mitigates" : "creates_risk", record.id, ref);
  for (const ref of record.ownership.ownerRefs) add("owned_by", record.id, ref);
  for (const ref of record.ownership.accountableRefs) add("accountable_to", record.id, ref);
  for (const ref of record.ownership.assigneeRefs) add("assigned_to", record.id, ref);
  for (const ref of record.provenance.sourceRefs) add("derived_from", record.id, ref);
  return Object.freeze(edges);
}

export function registerComplianceObjectTypes(registry) {
  if (!registry?.register) throw new Error("record registry is required");
  for (const type of COMPLIANCE_OBJECT_TYPES) if (!registry.get?.(type)) registry.register({ type, module: "compliance-object-primitives", schema: { contract: "packages/contracts/compliance-object-primitives.schema.json", recordType: type }, lifecycle: { states: COMPLIANCE_OBJECT_STATES } });
  return registry;
}
