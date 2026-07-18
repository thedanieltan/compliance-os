# Compliance OS Constitution

This constitution defines the repository's highest-level architectural commitments. Detailed Policy-as-Code rules live in `docs/policy/POLICY_AS_CODE_CONSTITUTION.md` and must remain consistent with this document.

## 1. Compliance is a state, not a function

DPM, KYC, vendor risk, breach management, DSAR handling, policy governance, AI governance, and security compliance are surfaces over the same deeper system.

Compliance OS exists to answer:

- what is true?
- when was it true?
- when did the system learn it?
- why is it believed or decided?
- who or what supplied it?
- who approved it?
- what evidence supports it?
- what obligation or control does it satisfy?
- which policy version produced the result?
- what changed?
- what action is allowed next?

## 2. Authority must be typed and traceable

Compliance OS must distinguish:

```text
authoritative source
reference source
interpretation
fact
obligation
control
evidence
policy rule
decision
approval
exception
override
proposed effect
executed effect
audit event
```

No layer may silently impersonate another.

An imported source, AI-generated interpretation, draft mapping, unverified observation, or runtime projection is not authoritative merely because it is structured.

## 3. Policy is compiled before it is executed

Executable policy must be represented as validated, versioned, provenance-bearing Policy IR artifacts.

Policy execution engines must consume canonical compiled bundles. They must not infer missing semantics, repair invalid packages, or reinterpret source material at evaluation time.

The compiler and evaluator are separate authority boundaries.

## 4. Decisions and effects are separate

A policy decision may authorize, deny, advise, require review, require attestation, require approval, or declare that no authoritative decision can be produced.

A decision does not itself mutate canonical state.

All meaningful effects must pass through a named, versioned, permissioned, policy-checked, approval-aware, auditable enforcement capability.

## 5. Generated UI is not authoritative

Generated workspaces may create views, forms, dashboards, drafts, task flows, and reports.

They may not bypass permissions, write directly to canonical records, delete evidence, rewrite audit history, activate policies, promote imported content, approve high-risk actions without configured authority, or create canonical schema changes without review.

## 6. All meaningful changes go through capabilities

A capability is a named, versioned, permissioned, auditable action.

Every capability declares:

- input schema;
- permission requirements;
- policy checks;
- workflow preconditions;
- data lifecycle impact;
- audit event;
- emitted domain events;
- dry-run behavior;
- approval requirements;
- idempotency behavior;
- failure behavior;
- rollback or compensation behavior where applicable.

## 7. Evidence must be provable

Evidence must have:

- source;
- provenance;
- hash;
- classification;
- linked record;
- linked control or requirement where applicable;
- valid time;
- recorded time;
- freshness or expiry rule;
- verification state;
- approver or attestor where required;
- retention rule;
- audit trail.

The producer of evidence cannot be its sole verifier or approver where the evidence changes authoritative compliance state.

## 8. Framework mappings are typed

Mapping types include:

```text
equivalent
partially_equivalent
broader_than
narrower_than
related
conflicting
evidence_reusable_for
control_satisfies
requires_local_interpretation
```

Mappings must retain provenance, version, status, review state, temporal validity, and licensing constraints.

Framework mappings do not automatically prove compliance.

## 9. Personal-data lifecycle is mandatory

Every module declares personal-data categories, data-subject categories, purpose, access rules, retention behavior, export behavior, deletion behavior, sharing exposure, and breach-impact classification.

Destructive actions require explicit execution authority and cannot be inferred from explanatory or dry-run outputs.

## 10. Historical decisions are immutable

New facts, evidence, interpretations, standards, or policy versions may trigger reevaluation.

They must not rewrite historical decisions.

A new decision must reference the prior decision where relevant and record:

- the policy change;
- the knowledge change;
- the evaluation time;
- the resulting difference;
- the migration or review requirement.

## 11. Failure and conflict are explicit states

Missing facts, missing or stale evidence, conflicting facts, conflicting policies, invalid signatures, unsupported runtimes, failed migrations, and evaluation errors must not silently become allow, deny, compliant, or non-compliant.

The system must produce a bounded outcome and preserve diagnostics.

## 12. Automation authority is bounded

Every policy rule declares an execution class.

Some decisions may be deterministic. Others require approval, attestation, or human judgment. Some automation is prohibited.

Prompts, model confidence, workflow convenience, or connector capability cannot expand authority beyond the declared execution class.

## 13. External systems must adapt to Compliance OS semantics

OPA, Cedar, OSCAL, standards packs, connectors, registries, and marketplaces are integration surfaces.

They may extend reach, execution, interchange, and distribution. They may not replace or silently redefine canonical Compliance OS semantics.

## 14. Distribution must preserve trust

Policy packages must be versioned, validated, tested, signed, provenance-bearing, licensing-aware, and activation-governed.

Publication, admission, and activation are distinct lifecycle events. (Policy-package
admission is the governed local-acceptance operation defined in
`docs/policy/POLICY_PACKAGE_LIFECYCLE.md`; it was formerly written as
"installation".)

A marketplace cannot weaken registry trust, publisher accountability, revocation, or tenant policy.
