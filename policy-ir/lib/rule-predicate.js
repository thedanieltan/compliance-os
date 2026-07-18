import { isCanonicalRfc3339 } from "./rfc3339.js";

export const RULE_PREDICATE_SCHEMA_VERSION = "policy-rule-predicate.v1";
export const FACT_VALUE_TYPES = new Set(["STRING", "NUMBER", "BOOLEAN", "TIMESTAMP", "ENUM"]);
export const PREDICATE_OPERATORS = Object.freeze({
  IS_PRESENT: { arity: "unary", factTypes: null },
  IS_ABSENT: { arity: "unary", factTypes: null },
  IS_NULL: { arity: "unary", factTypes: null },
  IS_NOT_NULL: { arity: "unary", factTypes: null },
  IS_TRUE: { arity: "unary", factTypes: ["BOOLEAN"] },
  IS_FALSE: { arity: "unary", factTypes: ["BOOLEAN"] },
  EQUALS: { arity: "binary", factTypes: ["STRING", "NUMBER", "BOOLEAN", "TIMESTAMP", "ENUM"] },
  NOT_EQUALS: { arity: "binary", factTypes: ["STRING", "NUMBER", "BOOLEAN", "TIMESTAMP", "ENUM"] },
  GREATER_THAN: { arity: "binary", factTypes: ["NUMBER", "TIMESTAMP"] },
  GREATER_THAN_OR_EQUAL: { arity: "binary", factTypes: ["NUMBER", "TIMESTAMP"] },
  LESS_THAN: { arity: "binary", factTypes: ["NUMBER", "TIMESTAMP"] },
  LESS_THAN_OR_EQUAL: { arity: "binary", factTypes: ["NUMBER", "TIMESTAMP"] },
  IN: { arity: "set", factTypes: ["STRING", "NUMBER", "BOOLEAN", "TIMESTAMP", "ENUM"] },
  NOT_IN: { arity: "set", factTypes: ["STRING", "NUMBER", "BOOLEAN", "TIMESTAMP", "ENUM"] }
});
export const MAX_PREDICATE_DEPTH = 64;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isScalar(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function validateNode(node, path, depth, errors, leaves) {
  if (depth > MAX_PREDICATE_DEPTH) {
    errors.push(`${path}: predicate nesting exceeds the maximum depth of ${MAX_PREDICATE_DEPTH}`);
    return;
  }
  if (!isPlainObject(node)) {
    errors.push(`${path}: predicate node must be an object`);
    return;
  }
  const logical = ["all_of", "any_of", "not"].filter((key) => key in node);
  const leaf = ["fact", "operator", "value"].filter((key) => key in node);
  const allowed = new Set(["all_of", "any_of", "not", "fact", "operator", "value"]);
  const unknown = Object.keys(node).filter((key) => !allowed.has(key));
  if (unknown.length) {
    errors.push(`${path}: unexpected key(s) [${unknown.sort().join(", ")}]`);
    return;
  }
  if (logical.length && leaf.length) {
    errors.push(`${path}: a node must be either a logical combinator or a fact comparison`);
    return;
  }
  if (logical.length > 1) {
    errors.push(`${path}: a node must declare exactly one logical combinator`);
    return;
  }
  if (logical.length === 1) {
    const key = logical[0];
    if (key === "not") {
      if (!isPlainObject(node.not)) errors.push(`${path}.not: must be a predicate node`);
      else validateNode(node.not, `${path}.not`, depth + 1, errors, leaves);
      return;
    }
    if (!Array.isArray(node[key]) || node[key].length === 0) {
      errors.push(`${path}.${key}: must be a non-empty array`);
      return;
    }
    node[key].forEach((child, index) => validateNode(child, `${path}.${key}[${index}]`, depth + 1, errors, leaves));
    return;
  }
  if (typeof node.fact !== "string" || node.fact.length === 0 || typeof node.operator !== "string") {
    errors.push(`${path}: a fact comparison requires fact and operator`);
    return;
  }
  const spec = PREDICATE_OPERATORS[node.operator];
  if (!spec) {
    errors.push(`${path}.operator: unrecognized operator ${JSON.stringify(node.operator)}`);
    return;
  }
  const hasValue = Object.hasOwn(node, "value");
  if (spec.arity === "unary" && hasValue) errors.push(`${path}: ${node.operator} takes no value`);
  if (spec.arity === "binary" && (!hasValue || !isScalar(node.value))) errors.push(`${path}: ${node.operator} requires a scalar value`);
  if (spec.arity === "set" && (!Array.isArray(node.value) || node.value.length === 0 || !node.value.every(isScalar))) {
    errors.push(`${path}: ${node.operator} requires a non-empty scalar array`);
  }
  leaves.push({ fact: node.fact, operator: node.operator, value: node.value, hasValue });
}

export function validateRulePredicateStructure(predicate) {
  const errors = [];
  const leaves = [];
  if (!isPlainObject(predicate)) return { errors: ["predicate: must be an object"], leaves };
  const allowed = new Set(["predicate_schema_version", "applicability", "assertion"]);
  for (const key of Object.keys(predicate)) if (!allowed.has(key)) errors.push(`predicate: unexpected key ${JSON.stringify(key)}`);
  if (predicate.predicate_schema_version !== RULE_PREDICATE_SCHEMA_VERSION) errors.push(`predicate: unsupported schema version`);
  if (!("assertion" in predicate)) errors.push("predicate.assertion: required");
  else validateNode(predicate.assertion, "predicate.assertion", 1, errors, leaves);
  if (predicate.applicability !== undefined && predicate.applicability !== null) {
    validateNode(predicate.applicability, "predicate.applicability", 1, errors, leaves);
  }
  return { errors, leaves };
}

export function predicateValueMatchesType(value, valueType, enumValues) {
  switch (valueType) {
    case "STRING": return typeof value === "string";
    case "NUMBER": return typeof value === "number" && Number.isFinite(value);
    case "BOOLEAN": return typeof value === "boolean";
    case "TIMESTAMP": return isCanonicalRfc3339(value);
    case "ENUM": return typeof value === "string" && Array.isArray(enumValues) && enumValues.includes(value);
    default: return false;
  }
}

export function validatePredicateLeafTypes(predicate, resolveFactMeta) {
  const { errors: structureErrors, leaves } = validateRulePredicateStructure(predicate);
  if (structureErrors.length) return [];
  const errors = [];
  for (const leaf of leaves) {
    const meta = resolveFactMeta(leaf.fact);
    if (!meta || !FACT_VALUE_TYPES.has(meta.value_type)) continue;
    const spec = PREDICATE_OPERATORS[leaf.operator];
    if (spec.factTypes && !spec.factTypes.includes(meta.value_type)) {
      errors.push(`operator ${leaf.operator} is not defined over fact ${JSON.stringify(leaf.fact)} of type ${meta.value_type}`);
      continue;
    }
    if (spec.arity === "binary" && !predicateValueMatchesType(leaf.value, meta.value_type, meta.enum_values)) {
      errors.push(`literal for fact ${JSON.stringify(leaf.fact)} does not match ${meta.value_type}`);
    }
    if (spec.arity === "set" && !leaf.value.every((value) => predicateValueMatchesType(value, meta.value_type, meta.enum_values))) {
      errors.push(`set literal for fact ${JSON.stringify(leaf.fact)} does not match ${meta.value_type}`);
    }
  }
  return errors;
}
