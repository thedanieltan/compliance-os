# Policy IR artifact family

Policy IR is a graph of typed artifacts, not a monolithic policy object.

## Common envelope

Every artifact carries:

- stable `artifact_id` and `artifact_type`;
- schema and artifact versions;
- lifecycle status;
- publisher reference;
- provenance and source references;
- valid-time bounds;
- licensing class;
- content hash when available;
- typed references to related artifacts.

Domain-specific fields are permitted only beneath `extensions`.

## Core graph

```text
POLICY_SOURCE / AUTHORITY_REFERENCE
→ INTERPRETATION
→ OBLIGATION
→ CONTROL
→ EVIDENCE_CONTRACT
→ POLICY_RULE
→ DECISION
→ proposed WORKFLOW_EFFECT
```

The graph is not required to be a single chain. References are explicit, required references must resolve, cycles are rejected in v1 and stricter licensing must be preserved by downstream artifacts.

A `POLICY_RULE` predicate consumes typed `FACT_DEFINITION` artifacts. The predicate grammar is closed and declarative; executable code, templates and free-form expressions are not Policy IR.
