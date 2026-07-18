# Contributing to Compliance OS

Compliance OS is built around explicit authority boundaries. Contributions must preserve those boundaries rather than bypass them for convenience.

## Development

```bash
npm install
npm test
npm run policy-ir:validate
npm run domain-pack:strict
```

## Pull requests

Every pull request must:

- state the bounded change;
- identify affected Policy IR artifacts or domain-pack material;
- describe decision, effect, temporal, migration and licensing impact where relevant;
- include positive and negative tests;
- avoid unrelated cleanup;
- keep domain semantics in `domain-packs/` or `extensions`, not in the substrate.

A decision must not enact an effect. Missing information must not silently become `PASS`, `FAIL`, `ALLOW` or `DENY`.

By submitting a contribution, you agree that it is licensed under Apache License 2.0.
