# Policy execution-class taxonomy

Every executable rule declares an execution class. The class limits which decisions automation may produce.

| Class | Meaning |
|---|---|
| `NON_EXECUTABLE_REFERENCE` | Reference content that cannot produce an operational decision. |
| `DETERMINISTIC` | A complete declarative predicate may produce a bounded deterministic result. |
| `DETERMINISTIC_WITH_APPROVAL` | A deterministic result requires approval before enforcement. |
| `ATTESTATION_REQUIRED` | An accountable attestation is required. |
| `HUMAN_DECISION_REQUIRED` | Automation may prepare material, but a human must decide. |
| `PROHIBITED_AUTOMATION` | Automated decision-making is prohibited. |

The evaluator MUST NOT broaden a class. Confidence, convenience, agent identity or connector capability cannot substitute for the required approval, attestation or human decision.
