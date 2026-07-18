#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const excluded = new Set([".git", "node_modules", "coverage", "dist"]);
const forbiddenNames = [/^\.env(?:\..+)?$/i, /credentials/i, /service-account/i, /\.pem$/i, /\.p12$/i, /\.pfx$/i];
const privateRepo = "compliance-os" + ".Open";
const privateRunner = "self-hosted" + ", Linux, X64, private, comos";
const patterns = [
  [privateRepo, "private donor repository name"],
  [privateRunner, "private runner labels"],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key material"],
  [/\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/, "GitHub credential"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b/, "private network address"],
  [/(?:^|[\s"'`])\/(?:home|Users)\/[A-Za-z0-9._-]+\//m, "local user path"],
  [/[A-Za-z]:\\Users\\[^\\\s]+\\/i, "Windows user path"]
];
const findings = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    const relative = path.relative(root, full).replaceAll(path.sep, "/");
    if (entry.isDirectory()) { walk(full); continue; }
    if (forbiddenNames.some((pattern) => pattern.test(entry.name))) findings.push(`${relative}: sensitive filename`);
    const stat = fs.statSync(full);
    if (stat.size > 1_000_000) continue;
    const buffer = fs.readFileSync(full);
    if (buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    for (const [pattern, label] of patterns) {
      const matched = typeof pattern === "string" ? text.includes(pattern) : pattern.test(text);
      if (matched && relative !== "scripts/validate-public-release.js") findings.push(`${relative}: ${label}`);
    }
  }
}
walk(root);
if (findings.length) { console.error(findings.join("\n")); process.exitCode = 1; }
else console.log("public release validation passed");
