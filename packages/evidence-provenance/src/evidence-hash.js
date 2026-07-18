import { createHash } from "node:crypto";

function sealedEvidence(evidence) {
  return {
    id: evidence.id,
    evidenceClass: evidence.evidenceClass,
    workspaceId: evidence.workspaceId,
    source: evidence.source,
    collection: evidence.collection,
    scope: evidence.scope,
    assertion: evidence.assertion,
    validity: evidence.validity,
    derivation: evidence.derivation
  };
}

export function computeEvidenceDigest(evidence) {
  return `sha256:${createHash("sha256").update(JSON.stringify(sealedEvidence(evidence))).digest("hex")}`;
}

export function withEvidenceIntegrity(evidence) {
  return Object.freeze({ ...evidence, integrity: Object.freeze({ algorithm: "sha256", digest: computeEvidenceDigest(evidence) }) });
}
