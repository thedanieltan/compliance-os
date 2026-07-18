# Compliance OS

Compliance OS is an open compliance substrate for building domain-specific compliance systems without embedding domain semantics into the core runtime.

It provides neutral backend primitives for:

- canonical records;
- permissioned capabilities;
- audit events;
- evidence provenance;
- framework mappings;
- domain-pack manifests;
- connector contracts;
- regulatory-update primitives;
- agent-safe execution;
- canonical Policy-as-Code semantics.

Data protection management is the first flagship domain, not the whole system.

## Status

This public repository is being populated from the validated Compliance OS substrate. The initial extraction is intentionally staged so private development history, private integrations, credentials, generated evidence, and unreviewed work are not copied into the public repository.

The project is not production-ready.

## Architecture

The canonical policy path is:

```text
authoritative sources
→ typed Policy IR
→ canonical policy compiler
→ signed compiled bundle
→ conformant evaluator
→ decision + proposed effects
→ governed enforcement point
→ authoritative mutation
→ audit event
```

Domain-packs own domain vocabulary and interpretation. The substrate owns neutral records, runtime contracts, provenance, authority, lifecycle, decisions, proposed effects, and auditability.

## Public extraction status

The first public release will include only material that has passed:

- public-boundary review;
- licensing and provenance review;
- secret and private-reference review;
- repository tests and manifest validation;
- Policy IR and governance validation.

## Licence

A project licence has not yet been selected. Until a licence is added, the repository is publicly readable but no permission is granted to copy, modify, or redistribute its contents.

## Security

Do not report security vulnerabilities through public issues. A security policy will be added before the first code release.
