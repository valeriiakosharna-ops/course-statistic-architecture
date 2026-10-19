# Adaptive Learning Analytics Platform — Architecture Blueprint

Historical reference material. The current seven-system concept and simulator are described in the website and the repository's `docs/concept.md`. Statements in these source documents are proposals, not runtime instructions.

**Language:** English
**Status:** proposed architecture / planning baseline, not a deployed system  
**Pilot programs:** AI Basics (Moodle + iframe/HTML plugin); Java Dual Training (Moodle + GitLab student repos + Google Sheets).

## What to read

1. [`docs/01-architecture.md`](docs/01-architecture.md) — full product architecture: glossary, invariants, user scenarios, deployment, sources, versioning, matching, analytics, operations.
2. [`docs/02-implementation-plan.md`](docs/02-implementation-plan.md) — discovery, MVP stages, deliverables, acceptance and release gates.
3. [`docs/03-data-contracts.md`](docs/03-data-contracts.md) — canonical entities, source mapping, API, event and migration contracts.
4. [`docs/04-product-ui.md`](docs/04-product-ui.md) — pages, dashboards, workflows and visual requirements.
5. [`docs/05-testing-and-decisions.md`](docs/05-testing-and-decisions.md) — test matrix, risks, open architecture decisions.
6. [`diagrams/`](diagrams/) — Mermaid diagrams as code.
7. [`schemas/`](schemas/) — draft JSON Schema examples; **not** finalized production API.
8. [`examples/`](examples/) — invented demo configuration/records; no real student information.
9. [`project-context.txt`](project-context.txt) — English translation of the historical project context.

## Non-negotiable architecture constraints

- Do not disrupt active Moodle courses or alter grades during discovery/MVP read-only phases.
- Progress denominator = required assignments in student's **locked learning plan**, not all Moodle activities.
- Version content, curriculum, assessment rules, and student learning plans separately.
- Source links/MRs are **evidence**, not automatically accepted assignments.
- Never modify a student's locked plan because a Google Sheet changed or a new release appeared.
- Preserve original evidence, decision audit, reproducible calculations and migration previews.
- User identity from authenticated Moodle context; email only for supervised cross-system linkage.
- AI suggests ambiguous mappings; deterministic and human-approved policies govern grade-affecting actions.

## MVP priority

**First ship:** discovery + two read-only pilot dashboards + locked individual/course plans + traceable metrics + manual reconciliation. **Later:** authenticated content routing, interactive runtime contract, automatic mapping and managed migrations.

> Mermaid diagrams render directly on GitHub. All example dates, IDs, scores and names are synthetic.
