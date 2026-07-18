import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { compilePolicyPackage } from "../packages/policy-compiler/src/index.js";
import { evaluateCompiledBundle } from "../packages/policy-evaluator/src/index.js";
import { loadDomainPack } from "../packages/domain-pack-loader/src/index.js";
import { DOMAIN_REFERENCE_DOMAINS } from "../domain-material/domain-reference-domains.js";
import { complianceObjectGraphEdges, createAssessmentRecord, createFindingRecord, createObligationRecord, createRemediationRecord, createRequirementRecord, validateComplianceObject } from "../packages/compliance-object-primitives/src/index.js";
import { createEvidenceRecord, markEvidenceReviewed, validateEvidenceRecord } from "../packages/evidence-provenance/src/index.js";
import { createApprovalRecord, validateApprovalRecord } from "../packages/approval-primitives/src/index.js";
const ROOT = process.cwd();
const T0 = "2026-07-18T00:00:00.000Z", T1 = "2026-07-18T01:00:00.000Z";
for (const [id, name, factDefinitions] of DOMAIN_REFERENCE_DOMAINS) {
  test(`${id} loads strictly and evaluates deterministically`, () => {
    assert.equal(loadDomainPack(id, { root: ROOT, strict: true }).manifest.id, id);
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "policy-ir", "examples", `${id}-reference-min.json`), "utf8"));
    const compiled = compilePolicyPackage(pkg);
    assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
    const facts = Object.fromEntries(factDefinitions.map(([slug, , , , positive]) => [`${id}:fact.${slug}`, positive]));
    const request = { evaluation_id: `evaluation:${id}`, evaluated_at: T1, facts };
    const first = evaluateCompiledBundle(compiled.bundle, request);
    const second = evaluateCompiledBundle(compiled.bundle, request);
    assert.equal(first.ok, true);
    assert.ok(first.decision.results.every((result) => result.outcome === "PASS"));
    assert.equal(first.decision.decision_hash, second.decision.decision_hash);
    const missing = evaluateCompiledBundle(compiled.bundle, { evaluation_id: `missing:${id}`, evaluated_at: T1, facts: {} });
    assert.ok(missing.decision.results.every((result) => result.outcome === "INSUFFICIENT_INFORMATION"));
  });
  test(`${id} uses existing neutral records, evidence, and approval`, () => {
    const workspaceId = `ws_${id}`;
    const scope = { workspaceId, tenantId: `tenant_${id}`, domainPackRefs: [id] };
    const extensions = { [`${id}.fixture`]: { source: "synthetic" } };
    const common = { workspaceId, state: "active", scope, subjectRefs: [`subject_${id}`], provenance: { sourceRefs: [`source_${id}`], recordedAt: T0 }, lifecycle: { createdAt: T0, updatedAt: T0 }, extensions };
    const requirement = createRequirementRecord({ ...common, id: `${id}_requirement`, title: `${name} requirement` });
    const obligation = createObligationRecord({ ...common, id: `${id}_obligation`, title: `${name} obligation`, relationships: { requirementRefs: [requirement.id] } });
    const assessment = createAssessmentRecord({ ...common, id: `${id}_assessment`, title: `${name} assessment`, relationships: { obligationRefs: [obligation.id], controlRefs: [`control_${id}`] } });
    const evidence = createEvidenceRecord({ id: `${id}_evidence`, evidenceClass: "assessment_result", workspaceId, source: { sourceType: "system", sourceSystem: `${id}_system`, sourceRef: `${id}_observation` }, collection: { collectedAt: T0, collectedBy: `${id}_producer`, collectorType: "system", collectionMethod: "system_observation" }, scope: { workspaceId, controlRefs: [`control_${id}`], domainPackRefs: [id] }, assertion: { claim: "Synthetic evidence.", assertedBy: `${id}_producer`, assertedAt: T0 }, validity: { validFrom: T0 }, derivation: { generatedBy: `${id}_producer` } });
    const reviewed = markEvidenceReviewed(evidence, { reviewedBy: `${id}_reviewer`, reviewedAt: T1, reviewStatus: "accepted" });
    const finding = createFindingRecord({ ...common, id: `${id}_finding`, title: `${name} finding`, relationships: { assessmentRefs: [assessment.id], evidenceRefs: [reviewed.id] }, provenance: { sourceRefs: [reviewed.id], recordedAt: T1 }, lifecycle: { createdAt: T1, updatedAt: T1 } });
    const remediation = createRemediationRecord({ ...common, id: `${id}_remediation`, title: `${name} remediation`, relationships: { findingRefs: [finding.id] }, provenance: { sourceRefs: [finding.id], recordedAt: T1 }, lifecycle: { createdAt: T1, updatedAt: T1 } });
    const approval = createApprovalRecord({ id: `${id}_approval`, workspaceId, requestedBy: `${id}_requester`, subjectType: "graph_node", subjectRef: finding.id, status: "approved", outcome: "approved", reason: "Synthetic approval fixture.", authority: { approverId: `${id}_approver_1`, approverType: "human", authorityBasis: "role", additionalApprovers: [{ approverId: `${id}_approver_2`, approverType: "human", authorityBasis: "committee_charter" }] }, scope: { workspaceId, graphNodeRefs: [finding.id], evidenceRefs: [reviewed.id] }, inputs: { evidenceRefs: [reviewed.id] }, guardrails: ["requires_reason", "requires_dual_control", "requires_human_approval", "requires_audit_event", "cannot_self_approve", "cannot_auto_approve"], lifecycle: { createdAt: T1, decidedAt: T1, auditEventRefs: [`audit_${id}`] } });
    for (const record of [requirement, obligation, assessment, finding, remediation]) assert.equal(validateComplianceObject(record), true);
    assert.equal(validateEvidenceRecord(reviewed), true);
    assert.equal(validateApprovalRecord(approval), true);
    assert.ok(complianceObjectGraphEdges(remediation).some((edge) => edge.type === "remediates" && edge.to === finding.id));
  });
}
test("domain-specific top-level fields remain prohibited", () => { assert.throws(() => createAssessmentRecord({ id: "invalid", workspaceId: "ws", title: "Invalid", state: "active", scope: { workspaceId: "ws", domainPackRefs: ["dpm"] }, subjectRefs: ["subject"], provenance: { sourceRefs: ["source"], recordedAt: T0 }, lifecycle: { createdAt: T0, updatedAt: T0 }, extensions: {}, severity: "high" }), /unknown compliance object field/); });
