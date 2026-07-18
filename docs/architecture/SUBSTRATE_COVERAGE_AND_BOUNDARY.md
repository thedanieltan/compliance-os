# Substrate Coverage and Domain Boundary

The substrate owns horizontal mechanics shared across unrelated compliance domains: typed records, Policy IR, compilation, bounded evaluation, evidence provenance, approval authority, auditability, domain-pack loading and strict validation.

The neutral compliance record family consists of:

- requirement;
- obligation;
- assessment;
- finding;
- remediation.

Domain packs own vocabulary, taxonomies, framework mappings, scoring methods, legal or regulatory interpretation, control libraries, domain workflows, deadlines and presentation behavior. Domain-specific fields belong in namespaced `extensions`; unknown top-level fields fail closed.

A concept belongs in the substrate only when unrelated domains can use its contract and lifecycle unchanged.
