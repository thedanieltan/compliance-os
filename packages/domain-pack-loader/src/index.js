import fs from "node:fs";
import path from "node:path";

export const DOMAIN_PACK_SECTIONS = [
  "records", "capabilities", "schemas", "workflows", "obligations",
  "evidence", "permissions", "surfaces", "migrations", "tests"
];

export function validateDomainPackManifest(manifest, { rootDir = null, strict = false } = {}) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return { ok: false, errors: ["manifest must be an object"] };
  for (const field of ["id", "name", "version", "vertical", "status"]) if (typeof manifest[field] !== "string" || !manifest[field]) errors.push(`${field} is required`);
  for (const section of DOMAIN_PACK_SECTIONS) {
    if (!Array.isArray(manifest[section])) errors.push(`${section} must be an array`);
    for (const entry of manifest[section] ?? []) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        errors.push(`${section} entry must be an object`);
        continue;
      }
      if (typeof entry.id !== "string" || !entry.id.startsWith(`${manifest.id}.`)) errors.push(`${section} entry id must be namespaced by ${manifest.id}`);
      if (strict && entry.ref?.target) {
        if (!rootDir) errors.push("rootDir is required for strict validation");
        else if (!fs.existsSync(path.resolve(rootDir, entry.ref.target))) errors.push(`${entry.id}: unresolved ref ${entry.ref.target}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export function loadDomainPack(packPath, options = {}) {
  const manifestPath = path.resolve(packPath, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const validation = validateDomainPackManifest(manifest, options);
  if (!validation.ok) throw new Error(validation.errors.join("\n"));
  return manifest;
}
