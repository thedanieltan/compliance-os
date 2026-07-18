import fs from "node:fs";
import path from "node:path";

export const DOMAIN_PACK_SECTIONS = Object.freeze(["records", "capabilities", "schemas", "workflows", "obligations", "evidence", "permissions", "surfaces", "migrations", "tests"]);
const METADATA = new Set(["id", "name", "version", "vertical", "status"]);

export function validateDomainPackManifest(manifest, { rootDir = null, strict = false } = {}) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return { ok: false, errors: ["manifest must be an object"] };
  for (const field of METADATA) if (typeof manifest[field] !== "string" || !manifest[field]) errors.push(`${field} is required`);
  for (const key of Object.keys(manifest)) if (!METADATA.has(key) && !DOMAIN_PACK_SECTIONS.includes(key)) errors.push(`unknown section: ${key}`);
  for (const section of DOMAIN_PACK_SECTIONS) {
    if (!Array.isArray(manifest[section])) { errors.push(`${section} must be an array`); continue; }
    const ids = new Set();
    for (const entry of manifest[section]) {
      if (["records", "schemas", "migrations"].includes(section) && typeof entry === "string") continue;
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) { errors.push(`${section} entry must be an object`); continue; }
      if (typeof entry.id !== "string" || !entry.id.startsWith(`${manifest.id}.`)) errors.push(`${section} entry id must be namespaced by ${manifest.id}`);
      if (ids.has(entry.id)) errors.push(`${section} entry id must be unique: ${entry.id}`);
      ids.add(entry.id);
      if (strict) {
        const target = entry.ref?.target;
        if (!target) errors.push(`${entry.id}: strict reference target is required`);
        else if (!rootDir) errors.push("rootDir is required for strict validation");
        else if (!fs.existsSync(path.resolve(rootDir, target))) errors.push(`${entry.id}: unresolved ref ${target}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export function loadDomainPack(packIdOrPath, options = {}) {
  const root = options.root ?? options.rootDir ?? process.cwd();
  const candidate = path.resolve(packIdOrPath);
  const packRoot = fs.existsSync(path.join(candidate, "manifest.json")) ? candidate : path.join(root, "domain-packs", packIdOrPath);
  const manifestPath = path.join(packRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`missing domain pack manifest: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const validation = validateDomainPackManifest(manifest, { rootDir: root, strict: Boolean(options.strict) });
  if (!validation.ok) throw new Error(validation.errors.join("\n"));
  return Object.freeze({ id: manifest.id, root: packRoot, manifest, documents: Object.freeze({}) });
}

export function discoverDomainPacks(options = {}) {
  const root = options.root ?? process.cwd();
  const packsRoot = path.join(root, "domain-packs");
  if (!fs.existsSync(packsRoot)) return { packs: [], warnings: [] };
  return { packs: fs.readdirSync(packsRoot).filter((name) => fs.existsSync(path.join(packsRoot, name, "manifest.json"))).sort().map((id) => ({ id, path: path.join(packsRoot, id), source: "canonical" })), warnings: [] };
}
