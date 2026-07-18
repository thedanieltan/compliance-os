# Policy authority model

Compliance OS distinguishes authority by type and provenance.

## Authority classes

- `POLICY_SOURCE` records source material.
- `AUTHORITY_REFERENCE` identifies a recognized authority or source location.
- `INTERPRETATION` records a reviewable understanding of upstream source material.
- `FACT_DEFINITION` defines typed input accepted by policy rules.
- `OBLIGATION` and `CONTROL` describe required state and operational response.
- `EVIDENCE_CONTRACT` defines evidence that may support a control or decision.
- `POLICY_RULE` supplies executable declarative semantics.
- `APPROVAL_REQUIREMENT`, `EXCEPTION_POLICY` and `OVERRIDE_POLICY` constrain consequential authority.
- `DECISION_SCHEMA` defines bounded decision shape.
- `WORKFLOW_EFFECT` describes a proposed effect; it does not enact it.

A structured import, model-generated interpretation or runtime projection is not authoritative solely because it has a schema. Authority requires an explicit type, publisher, provenance, lifecycle state and applicable approval.
