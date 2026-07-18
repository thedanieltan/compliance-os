# Compliance OS

Compliance OS is an open-source, domain-neutral substrate for representing, compiling and evaluating compliance policy as typed, versioned and provenance-bearing data.

It is pre-release software. It does not provide legal advice, certify compliance or replace accountable human review.

## Public release scope

```text
authoritative sources
→ typed Policy IR
→ canonical policy compiler
→ bounded policy decision
→ proposed effects
→ governed enforcement point
```

The current release includes:

- Policy IR package and artifact validation;
- declarative, typed predicate semantics;
- execution-class and bounded-decision contracts;
- deterministic bundle compilation and hashing;
- a fail-closed native reference evaluator;
- neutral requirement, obligation, assessment, finding and remediation records;
- evidence provenance, independent review, expiry and supersession;
- approval authority, dual control and audit-event binding;
- 20 strict-loadable domain packs with synthetic OPEN reference material;
- public-release validation against common credential, local-path and private-network leakage;
- public tests and GitHub-hosted CI.

A policy decision does not mutate authoritative state. Enforcement, connectors, generated workspaces and production deployment are outside the current release boundary.

## Quickstart

Requires Node.js 20 or later.

```bash
npm install
npm test
npm run policy-ir:validate
npm run domain-pack:validate
npm run domain-pack:strict
npm run domain-material:check
npm run public-release:validate
npm run demo
```

## Repository structure

- `policy-ir/` — canonical Policy IR schema, validation and examples.
- `packages/policy-compiler/` — deterministic canonical compiler.
- `packages/policy-evaluator/` — native fail-closed reference evaluator.
- `packages/compliance-object-primitives/` — neutral compliance records and graph projection.
- `packages/evidence-provenance/` — evidence provenance, integrity and review lifecycle.
- `packages/approval-primitives/` — approval authority and delegation records.
- `packages/domain-pack-loader/` — strict domain-pack manifest loading.
- `decision-effect/` — bounded decision contract.
- `execution-classes/` — automation-authority taxonomy.
- `domain-packs/` — governed domain content, separate from substrate mechanics.
- `docs/policy/` — normative Policy-as-Code contracts.
- `tests/` — positive, negative, tamper and boundary checks.

Read `COMPLIANCE_OS_CONSTITUTION.md`, then `docs/policy/README.md`.

## Contribution and security

See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md`.

## Licence

Apache License 2.0. See `LICENSE` and `NOTICE`.
