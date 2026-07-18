export const EXECUTION_CLASS_SCHEMA_VERSION = "policy-execution-classes.v1";

export function validateExecutionClasses(document) {
  const errors = [];
  if (!document || typeof document !== "object") return { ok: false, errors: ["execution-class document must be an object"] };
  if (document.schema_version !== EXECUTION_CLASS_SCHEMA_VERSION) errors.push("unsupported execution-class schema version");
  if (!Array.isArray(document.classes) || document.classes.length === 0) errors.push("classes must be a non-empty array");
  const names = new Set();
  for (const entry of document.classes ?? []) {
    if (typeof entry.class !== "string" || !entry.class) errors.push("class name is required");
    if (names.has(entry.class)) errors.push(`duplicate execution class ${entry.class}`);
    names.add(entry.class);
    if (!Array.isArray(entry.permitted_decisions) || entry.permitted_decisions.length === 0) errors.push(`${entry.class}: permitted_decisions must be non-empty`);
  }
  return { ok: errors.length === 0, errors };
}
