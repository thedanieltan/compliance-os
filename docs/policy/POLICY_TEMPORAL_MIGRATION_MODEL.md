# Temporal and migration model

Compliance OS distinguishes:

- valid time — when a fact, rule or obligation applies in the represented world;
- recorded time — when the system learned or stored it;
- evaluation time — when a policy decision was produced.

Temporal values use canonical RFC 3339 timestamps with explicit offsets. Historical decisions remain immutable. A policy, schema, fact or projection change may require reevaluation, but it produces a new decision linked to the changed inputs rather than rewriting the previous decision.

Schema, semantic, fact and projection migrations are explicit operations. Unsupported migrations fail closed and remain reviewable.
