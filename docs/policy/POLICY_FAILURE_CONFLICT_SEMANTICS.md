# Failure and conflict semantics

Compliance OS fails closed without collapsing distinct states into allow/deny or pass/fail.

Examples of bounded non-success states include:

- `INSUFFICIENT_INFORMATION` for missing required facts;
- `EVIDENCE_GAP` for absent, stale or invalid evidence;
- `FACT_CONFLICT` for incompatible facts;
- `POLICY_CONFLICT` for unresolved policy conflict;
- `NO_AUTHORITATIVE_DECISION` when the package cannot authorize a decision;
- `PROHIBITED_AUTOMATION` when automation is forbidden;
- `ERROR` for bounded evaluation failure.

Diagnostics are preserved. A conflict is data that requires resolution; it is not silently handled by rule order or implementation convenience.
