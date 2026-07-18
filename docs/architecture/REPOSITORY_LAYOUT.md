# Repository Layout Convention

- **Document state:** NORMATIVE (repository convention; beneath ADR-0014 and ADR-0031, not itself an ADR).
- **Owns:** where reusable kernel modules, applications, governed extension content, automation, specs, and tests live.

## Placement rule

| Path family | Contents |
|---|---|
| `packages/*` | **Reusable kernel modules** (workspace packages): records, identity, authorization, facts-scope, obligations, controls, risk, evidence, audit, authority, cases, workflow-runtime, policy-ir, policy-compiler, policy-evaluator, runtime-manifest, projections, connectors, event-contracts, persistence, execution-classes, decision-effect, domain-pack-sdk. |
| `apps/*` | Deployable application shells (e.g. professional workspace, public portals, management console). |
| `domain-packs/*` | Governed extension content (DPM, cybersecurity, AI governance, vendor assurance). **Not** kernel libraries; never placed under `packages/`. |
| `framework-packs/*` | Framework crosswalk packs (ISO 27001, SOC 2, NIST). |
| `automation/*` | Autonomous-governance configuration, review contract, queue, run records. |
| `architecture/*` | Canonical ADR register, schema, policy modules, registries, generated projection. |
| `docs/*` | ADRs (`docs/adr/`), policy specs (`docs/policy/`), architecture specs (`docs/architecture/`), ontology, roadmap, work packages. |
| `tests/*` | Repository-wide and per-domain tests. |
| `examples/*` | Runnable demos. |

## Rules

1. A new **reusable kernel module** MUST be created under `packages/*`, never at the repository root.
2. Create a package only where a real ownership boundary exists; do not split trivial helpers into independent packages or services.
3. Domain packs and framework packs are governed content and stay in their own top-level families.
4. The folder location of a module is a repository convention; it does not by itself require an ADR. A module's *authority boundary* (what it may decide, mutate, or expose) is governed by the relevant ADR.

## Migration status (WP-REPO-LAYOUT-01)

The initial Policy-as-Code slices were created at the repository root
(`policy-ir/`, `execution-classes/`, `decision-effect/`) while the convention was
being settled. WP-REPO-LAYOUT-01 relocates them under `packages/*` in one bounded
migration that moves files with history, updates imports/exports, tests,
workflows, and documentation, and adds a guard preventing new reusable kernel
modules at the repository root. Until that migration merges, those three
directories remain at the root and are the only sanctioned exceptions.
