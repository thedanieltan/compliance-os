# Compiler, evaluator and enforcement boundary

## Compiler

The compiler validates Policy IR, resolves references, checks predicate types, canonicalizes the package and emits a content-addressed compiled bundle. Invalid required references, unsupported execution classes, invalid predicates and licensing violations fail closed.

## Evaluator

The evaluator consumes a valid compiled bundle and a canonical evaluation request. It verifies bundle integrity and produces a bounded immutable decision. It MUST NOT compile, repair, reinterpret, approve evidence, enact effects or bypass a required human decision.

## Enforcement

Enforcement is outside the evaluator. A governed enforcement capability may consume a decision and proposed effect only after checking authority, approvals, preconditions, scope, idempotency and audit requirements.
