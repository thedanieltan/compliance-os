import { createHash } from "node:crypto";
import { createEvidenceReview, EVIDENCE_LIFECYCLE_STATUSES } from "./evidence-review.js";

const CLASSES = ["document_reference", "attestation", "system_observation", "connector_observation", "manual_observation", "configuration_snapshot", "log_excerpt", "test_result", "assessment_result", "metric", "certificate", "training_record", "approval_record", "compiler_artifact", "report_artifact"];
const SOURCE_TYPES = ["manual", "connector", "api", "import", "upload", "system", "compiler", "agent", "sidecar", "external_url"];
const COLLECTOR_TYPES = ["human", "service", "connector", "agent", "system", "compiler", "sidecar"];
const refs = (value) => Object.freeze([...new Set((value ?? []).filter(Boolean))]);
function explicit(value, label) { if (typeof value !== "string" || value.trim() === "" || value === "unknown") throw new Error(`${label} must be explicitly provided`); }
function assertTime(value, label, required = false) { if (value == null) { if (required) throw new Error(`${label} is required`); return; } if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an RFC3339 timestamp`); }
function sealed(evidence) { return { id: evidence.id, evidenceClass: evidence.evidenceClass, workspaceId: evidence.workspaceId, source: evidence.source, collection: evidence.collection, scope: evidence.scope, assertion: evidence.assertion, validity: evidence.validity, derivation: evidence.derivation }; }
function digest(value) { return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`; }
export function createEvidenceRecord(input = {}) {
  if (!input.id) throw new Error("evidence id is required");
  explicit(input.source?.sourceType, "evidence sourceType"); explicit(input.collection?.collectedAt, "evidence collectedAt"); explicit(input.collection?.collectedBy, "evidence collectedBy"); explicit(input.collection?.collectionMethod, "evidence collectionMethod"); explicit(input.collection?.collectorType, "evidence collectorType");
  if (!CLASSES.includes(input.evidenceClass ?? "document_reference")) throw new Error("invalid evidence class");
  if (!SOURCE_TYPES.includes(input.source.sourceType)) throw new Error("invalid evidence source type");
  if (!COLLECTOR_TYPES.includes(input.collection.collectorType)) throw new Error("invalid evidence collector type");
  const createdAt = input.lifecycle?.createdAt ?? input.collection.collectedAt;
  const core = {
    id: input.id, evidenceClass: input.evidenceClass ?? "document_reference", workspaceId: input.workspaceId ?? input.scope?.workspaceId ?? "default", title: input.title ?? input.id,
    source: Object.freeze({ sourceType: input.source.sourceType, sourceSystem: input.source.sourceSystem ?? null, sourceRef: input.source.sourceRef ?? null, sourceUri: input.source.sourceUri ?? null }),
    collection: Object.freeze({ collectedAt: input.collection.collectedAt, collectedBy: input.collection.collectedBy, collectionMethod: input.collection.collectionMethod, collectorType: input.collection.collectorType }),
    scope: Object.freeze({ workspaceId: input.workspaceId ?? input.scope?.workspaceId ?? "default", controlRefs: refs(input.scope?.controlRefs), requirementRefs: refs(input.scope?.requirementRefs), obligationRefs: refs(input.scope?.obligationRefs), domainPackRefs: refs(input.scope?.domainPackRefs) }),
    assertion: Object.freeze({ claim: input.assertion?.claim ?? null, assertedBy: input.assertion?.assertedBy ?? input.collection.collectedBy, assertedAt: input.assertion?.assertedAt ?? input.collection.collectedAt }),
    review: createEvidenceReview(input.review),
    validity: Object.freeze({ validFrom: input.validity?.validFrom ?? input.collection.collectedAt, validUntil: input.validity?.validUntil ?? null, staleAt: input.validity?.staleAt ?? null, expiryReason: input.validity?.expiryReason ?? null, supersededBy: input.validity?.supersededBy ?? null }),
    lifecycle: Object.freeze({ status: input.lifecycle?.status ?? "active", createdAt, updatedAt: input.lifecycle?.updatedAt ?? createdAt }),
    derivation: Object.freeze({ generatedBy: input.derivation?.generatedBy ?? null, derivedFrom: refs(input.derivation?.derivedFrom) })
  };
  const evidence = Object.freeze({ ...core, integrity: Object.freeze({ algorithm: "sha256", digest: digest(sealed(core)) }) });
  validateEvidenceRecord(evidence);
  return evidence;
}
export function validateEvidenceRecord(evidence) {
  if (!evidence?.id) throw new Error("evidence id is required");
  explicit(evidence.source?.sourceType, "evidence sourceType"); explicit(evidence.collection?.collectedAt, "evidence collectedAt"); explicit(evidence.collection?.collectedBy, "evidence collectedBy"); explicit(evidence.collection?.collectionMethod, "evidence collectionMethod"); explicit(evidence.collection?.collectorType, "evidence collectorType");
  if (!EVIDENCE_LIFECYCLE_STATUSES.includes(evidence.lifecycle?.status)) throw new Error("invalid evidence lifecycle status");
  if (!evidence.scope?.workspaceId || ![evidence.scope.controlRefs, evidence.scope.requirementRefs, evidence.scope.obligationRefs].some((value) => value.length > 0)) throw new Error("evidence must be scoped to a compliance object");
  assertTime(evidence.collection.collectedAt, "evidence collectedAt", true); assertTime(evidence.validity.validFrom, "evidence validFrom", true); assertTime(evidence.validity.validUntil, "evidence validUntil"); assertTime(evidence.validity.staleAt, "evidence staleAt"); assertTime(evidence.review.reviewedAt, "evidence reviewedAt");
  if (evidence.validity.validUntil && Date.parse(evidence.validity.validFrom) >= Date.parse(evidence.validity.validUntil)) throw new Error("evidence validFrom must precede validUntil");
  if (evidence.validity.staleAt && Date.parse(evidence.validity.staleAt) < Date.parse(evidence.validity.validFrom)) throw new Error("evidence staleAt cannot precede validFrom");
  if (evidence.lifecycle.status === "superseded" && (evidence.review.reviewStatus !== "superseded" || !evidence.validity.supersededBy)) throw new Error("superseded evidence requires aligned state and supersededBy");
  if (evidence.lifecycle.status === "expired" && (evidence.review.reviewStatus !== "expired" || !evidence.validity.expiryReason)) throw new Error("expired evidence requires aligned state and expiryReason");
  if (evidence.integrity?.digest !== digest(sealed(evidence))) throw new Error("evidence integrity verification failed");
  return true;
}
