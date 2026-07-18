# Policy-as-Code specifications

This directory describes the canonical Compliance OS Policy-as-Code contracts. `COMPLIANCE_OS_CONSTITUTION.md` is the highest-level architectural authority and `docs/adr/ADR-0001-policy-as-code-governing-substrate.md` records the governing decision.

The specifications use the normative meanings of MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT and MAY from RFC 2119 and RFC 8174.

## Documents

- `POLICY_AS_CODE_CONSTITUTION.md` — binding Policy-as-Code commitments.
- `POLICY_AUTHORITY_MODEL.md` — source, interpretation, publisher, approver and enforcement authority.
- `POLICY_IR_ARTIFACT_FAMILY.md` — typed Policy IR graph and common envelope.
- `POLICY_EXECUTION_CLASS_TAXONOMY.md` — bounded automation-authority classes.
- `POLICY_DECISION_EFFECT_CONTRACT.md` — evaluation requests, decisions and proposed effects.
- `POLICY_COMPILER_EVALUATOR_BOUNDARY.md` — compiler, evaluator and enforcement responsibilities.
- `POLICY_TEMPORAL_MIGRATION_MODEL.md` — valid time, recorded time, evaluation time and migration.
- `POLICY_FAILURE_CONFLICT_SEMANTICS.md` — explicit fail-closed outcomes and conflicts.
- `POLICY_PACKAGE_LIFECYCLE.md` — build, publication, admission and activation.

Examples are not authoritative merely because they are structured. Domain-pack content remains separate from substrate semantics.
