# Policy decision and effect contract

## Evaluation request

An evaluation request identifies the evaluation, the evaluation time and the supplied facts. Facts are typed by `FACT_DEFINITION` artifacts in the compiled bundle.

## Bounded decision

Every result uses the bounded outcome vocabulary in `decision-effect/lib/validate.js`. Missing facts resolve to `INSUFFICIENT_INFORMATION`, not an inferred pass or failure.

A decision records:

- decision identity;
- evaluation time;
- compiled bundle hash;
- rule-level bounded outcomes;
- proposed effects, if any;
- deterministic decision hash.

## Effect separation

A decision does not mutate authoritative state. A proposed effect is a request for a later governed enforcement capability. Enforcement must independently verify actor authority, approvals, preconditions, idempotency and audit requirements.
