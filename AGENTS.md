# Working in this repository

Help institutions interpret education statistics accurately. Arcada is the configurable first institution. Keep institutional preferences, targets, display language and programme mappings outside shared indicator logic.

- Read the README and the current milestone before changing behaviour. Record substantial decisions and observable acceptance criteria in docs.
- Preserve source codes as text, reporting periods, release status, denominators, suppression and provenance. Reconcile new indicators against a named published result. Record unexplained differences.
- Use public or synthetic data. Keep institutional extracts, survey responses, credentials, logs with payloads and reference images out of Git. Keep restricted processing under institutional control.
- Prefer ordinary PostgreSQL migrations, explicit SQL and repeatable imports. Dashboard reads use published data in the database. Verify retry, correction and failure behaviour before releasing an importer.
- Validate the normal user journey, including accessible tables, narrow screens, keyboard controls and missing-data states. State what was run and what remains unverified.
- Obtain owner approval before public deployment, paid provisioning, licensing or crossing an institutional data boundary. The Phase 0 handoff records the current review gate.
