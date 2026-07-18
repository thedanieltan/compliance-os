# Policy-as-Code constitution

This specification applies the repository constitution to executable policy.

## Canonical commitments

1. Source material, interpretations, facts, obligations, controls, evidence contracts, policy rules and decisions are distinct artifact types.
2. Source material is not executable policy by itself.
3. Executable policy is represented as validated, versioned and provenance-bearing Policy IR.
4. The compiler and evaluator are separate authority boundaries.
5. An evaluator consumes a compiled bundle and MUST NOT repair, reinterpret or complete it.
6. A decision is immutable and separate from any proposed or executed effect.
7. Missing information, stale evidence, conflicts, unsupported semantics and evaluation errors are explicit bounded outcomes.
8. Execution classes bound automation authority. Prompts, confidence scores and connector capability cannot expand that authority.
9. Historical decisions are not rewritten when policy or facts change; a later evaluation creates a new decision.
10. Domain semantics remain in domain packs or namespaced `extensions`, not in the substrate.
11. Machine output MUST NOT claim legal compliance or certification.
12. Publication, admission and activation are separate package lifecycle events.
