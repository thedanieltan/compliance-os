# ADR-0001: Policy-as-Code as the governing substrate

- **Status:** ACCEPTED
- **Decision class:** Governing architectural ADR
- **Scope:** Compliance OS public substrate

## Context

Compliance domains need common semantics for authority, facts, obligations, controls, evidence, decisions, approvals, effects and auditability. Allowing each domain pack, connector or external engine to define its own policy model would fragment authority and make results difficult to reproduce.

## Decision

Compliance OS adopts Policy-as-Code as a first-class governing substrate.

```text
source material
→ provenance capture
→ interpretation
→ typed Policy IR
→ validation
→ canonical compiler
→ compiled bundle
→ conformant evaluator
→ bounded decision + proposed effects
→ governed enforcement point
→ authoritative mutation
→ audit event
```

External technologies such as policy engines, assurance formats, standards packs and connectors adapt to these semantics. They do not replace them.

## Consequences

- Authority, provenance and decisions become reproducible and reviewable.
- Missing information and conflicts remain explicit.
- Compiler, evaluator and enforcement stay separate.
- Domain content may evolve independently without becoming kernel semantics.
- Initial delivery prioritizes stable contracts over broad connector or UI coverage.
