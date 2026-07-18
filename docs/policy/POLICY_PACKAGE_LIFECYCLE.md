# Policy package lifecycle

Compliance OS separates three concerns:

1. **Build lifecycle** — author, validate, test, version and sign package material.
2. **Distribution lifecycle** — publish, discover, revoke and retain provenance and licensing metadata.
3. **Deployment lifecycle** — admit a package to a tenant or workspace, review it and activate a specific version.

Publication does not equal admission. Admission does not equal activation. Activation must be atomic, scoped and auditable. Revocation or supersession does not rewrite historical decisions created from an earlier active bundle.
