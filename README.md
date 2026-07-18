# Compliance OS

Compliance OS is an open-source, domain-neutral substrate for representing, compiling and evaluating compliance policy as typed, versioned and provenance-bearing data.

It is pre-release software. It does not provide legal advice, certify compliance or replace accountable human review.

## Public release scope

This repository currently publishes the stable canonical path:

```text
authoritative sources
→ typed Policy IR
→ canonical policy compiler
→ bounded policy decision
→ proposed effects
→ governed enforcement point
```

The current release includes:

- the Policy IR package and artifact contract;
- declarative predicate validation;
- deterministic bundle compilation and hashing;
- a fail-closed native reference evaluator;
- bounded decision outcomes;
- the existing domain-pack manifest structure;
- a DPM reference package;
- public tests and GitHub-hosted CI.

A policy decision does not mutate authoritative state. Enforcement, connectors, generated workspaces and production deployment are outside the current release boundary.

## Quickstart

Requires Node.js 20 or later.

```bash
npm install
npm test
npm run policy-ir:validate
npm run domain-pack:strict
```

Compile and evaluate the included DPM example:

```bash
npm run demo
```

## Repository structure

- `policy-ir/` — canonical Policy IR schema, validation and examples.
- `packages/policy-compiler/` — deterministic canonical compiler.
- `packages/policy-evaluator/` — native fail-closed reference evaluator.
- `packages/domain-pack-loader/` — domain-pack manifest loading and strict reference validation.
- `decision-effect/` — bounded decision contract.
- `execution-classes/` — automation-authority taxonomy.
- `domain-packs/` — governed domain content, separate from the substrate.
- `tests/` — positive, negative and deterministic checks.

## Architectural commitments

Read `COMPLIANCE_OS_CONSTITUTION.md` first. The core commitments include typed authority, compiler/evaluator separation, immutable decisions, explicit failure states, evidence provenance and bounded automation authority.

## Contributing

See `CONTRIBUTING.md`. Contributions must preserve the existing authority boundaries and include tests for changed behavior.

## Licence

Apache License 2.0. See `LICENSE` and `NOTICE`.
