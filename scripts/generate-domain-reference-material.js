#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { DOMAIN_REFERENCE_DOMAINS } from "../domain-material/domain-reference-domains.js";

const root = process.cwd();
const envelope = (artifactId, artifactType, provenance) => ({ artifact_id: artifactId, artifact_type: artifactType, schema_version: "policy-ir.v1", artifact_version: "1.0.0", status: "ACTIVE", publisher_ref: "compliance-os", source_refs: [], provenance, valid_from: null, valid_to: null, content_hash: null, licensing: { class: "OPEN" } });
const title = (slug) => slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

function policyPackage(id, name, facts) {
  const obligationId = `${id}:obligation.reference`;
  const controlId = `${id}:control.reference`;
  const artifacts = [
    envelope(obligationId, "OBLIGATION", `Synthetic OPEN obligation for ${name}.`),
    { ...envelope(controlId, "CONTROL", `Synthetic OPEN control for ${name}.`), references: [{ ref: obligationId, required: true, relation: "operationalizes" }] },
    { ...envelope(`${id}:evidence.reference`, "EVIDENCE_CONTRACT", `Synthetic OPEN evidence contract for ${name}.`), references: [{ ref: controlId, required: true, relation: "assesses" }] }
  ];
  for (const [slug, valueType, operator, comparisonValue] of facts) {
    const factId = `${id}:fact.${slug}`;
    artifacts.push({ ...envelope(factId, "FACT_DEFINITION", `Synthetic OPEN fact definition for ${name}.`), body: { value_type: valueType } });
    const assertion = { fact: factId, operator };
    if (comparisonValue !== null) assertion.value = comparisonValue;
    artifacts.push({ ...envelope(`${id}:rule.${slug}`, "POLICY_RULE", `Synthetic OPEN deterministic rule for ${name}.`), references: [{ ref: factId, required: true, relation: "consumes" }, { ref: controlId, required: true, relation: "assesses" }], body: { execution_class: "DETERMINISTIC", predicate: { predicate_schema_version: "policy-rule-predicate.v1", assertion } } });
  }
  return { package_manifest: { package_id: `${id}-reference-min`, version: "0.1.0", schema_version: "policy-ir.v1", publisher: "compliance-os", licensing: { class: "OPEN" }, dependencies: [] }, artifacts };
}

function manifest(id, name, facts) {
  const entries = facts.map(([slug]) => ({ id: `${id}.workflow.${slug}`, label: title(slug), description: `Synthetic Policy IR material for ${slug.replaceAll("-", " ")}.`, ref: { type: "policy-ir-example", target: `policy-ir/examples/${id}-reference-min.json` } }));
  return { id, name, version: "0.1.0", vertical: id.replaceAll("-", "_"), status: "experimental", records: [], capabilities: [], schemas: [], workflows: entries, obligations: entries.map((entry) => ({ ...entry, id: entry.id.replace(".workflow.", ".obligation.") })), evidence: entries.map((entry) => ({ ...entry, id: entry.id.replace(".workflow.", ".evidence.") })), permissions: [], surfaces: [], migrations: [], tests: [{ id: `${id}.test.reference-model`, label: "Reference model test", description: "Cross-domain reference-model test.", ref: { type: "node-test", target: "tests/domain-pack-reference-model.test.js" } }] };
}

for (const [id, name, facts] of DOMAIN_REFERENCE_DOMAINS) {
  const packDir = path.join(root, "domain-packs", id);
  const exampleDir = path.join(root, "policy-ir", "examples");
  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(exampleDir, { recursive: true });
  fs.writeFileSync(path.join(packDir, "manifest.json"), `${JSON.stringify(manifest(id, name, facts), null, 2)}\n`);
  fs.writeFileSync(path.join(exampleDir, `${id}-reference-min.json`), `${JSON.stringify(policyPackage(id, name, facts), null, 2)}\n`);
}
console.log(`generated ${DOMAIN_REFERENCE_DOMAINS.length} domain manifests and Policy IR packages`);
