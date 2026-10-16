# 02 — Phased implementation roadmap and acceptance gates

## Working method

Prioritize correctness and non-invasive integration. Every stage produces a reviewed artifact, test evidence and explicit go/no-go gate. Ownership roles: program owner (curriculum/business semantics), Moodle developer (plugin/API/grades), integration/backend developer, analytics developer, GitLab/content maintainer, UX/product, security/operations.

## Stage 0 — Discovery and baseline (no production writes)

### Setup to request from existing systems

**Moodle:** site/version/plugin list; test/staging environment; site/course IDs; exported sample data; permissions of read-only service account; gradebook and activity mappings; completion configuration; Quiz attempts; native Assignment submissions and submitted URLs; custom AsciiDoc plugin code and scoring flow; H5P availability; event logs; source of student enrollment and first meaningful start event; how/where iframe is hosted, CSP/cookies/SSO design. Use anonymized fixtures for initial development.

**GitLab:** inventory of content repos and CI pipelines; publication paths, tags, SHA and static assets; Java parent groups/subgroups/repos/forks and membership; API access; MR examples (clean, unclear, multi-task, no linkage, revisions), branch/review conventions if any; how Moodle assignment URLs refer to GitLab.

**Sheets:** all used Java homework tables; owners; layouts/headers; group names and dates; example historical revisions; deadlines and overrides; optional legacy data exports. Confirm timezone and change authority. **Do not force a complete redesign of active sheets.**

**Policy:** 1) when course truly starts; 2) who can assign curriculum; 3) definition of submitted/reviewed/accepted; 4) deadline rules; 5) grade weighting; 6) effective dates and pauses; 7) curriculum publishing and migration approvals; 8) source error escalation; 9) allowable student data/retention.

### Deliverables

- `system-inventory.csv` (source, course, object IDs, permissions, owner, limitations).
- Redacted `source-samples/` for Moodle results, Java MR cases and Sheets rows.
- `source-field-matrix.csv` mapping external fields → canonical fields; flags: observed/missing/uncertain.
- Two signed-off curriculum task catalogs and a definition of `required` per learner.
- `metric-definitions-v1` and 10–20 manually verified student-case ground truths across both pilots.
- Compatibility audit: iframe/versions, Moodle grade item and quiz attempt behavior, plugin write path.

**Gate:** Can demonstrate one student’s learning plan and explain every included task, grade and completion value. If not, do not build final dashboard as if data were complete.

## Stage 1 — Foundation: unified read-only ingestion and registry

### Build

- Modular FastAPI backend; PostgreSQL; migrations; workers and run logs; authentication/RBAC for staff.
- Source adapters: Moodle core + custom read-only plugin endpoint if needed; GitLab API; Sheets read-only. Configurable source registry.
- Raw snapshots, incremental sync cursors, idempotency, source heartbeat/data health; initial manual reconciliation UI.
- Core entities: program, course instance, learner/identity link, content unit, task, curriculum version, learning instance, plan revision, assignment, evidence, results.
- One-time or explicit approval mapping for existing activities; save unmapped records separately.
- Published curriculum manifests for both pilots; no grade write-back.

**Gate:** Two consecutive syncs are idempotent; historical evidence survives source failure; unknown/missing fields are visible; different groups get different applicable denominators.

## Stage 2 — AI Basics MVP: independent self-paced analytics

### Build

- Self-paced learner first-start policy using **meaningful action**, not enrollment by default.
- Atomic lock to version for new starts, with administrative fallback for preexisting learners where exact historical start/build is unknown. Mark inferred historical locks, do not claim precision.
- Read Moodle grades, completion, custom plugin results, available Quiz attempts, score versions.
- UI: course overview; student drilldown; assessment attempt history when present; source-quality annotations; progress history. Render historical data availability honestly.
- Version health settings: expected 30 days (configurable), thresholds, official pauses, outdated release severity, notifications.

**Gate:** Same user opening course repeatedly does not change lock; publishing v2 does not change any v1 student denominator; score/dashboard agree with manually checked examples.

## Stage 3 — Java Dual MVP: group assignments and GitLab evidence

### Build

- Sheets importer: column mapping, preview, group aliases, task IDs, dates; `proposed_plan_diff`; admin approval → plan revision.
- GitLab project/subgroup/identity linking with verified rules; Moodle assignments' submitted MR URLs as high-quality explicit evidence.
- Evidence matching: direct URLs/IDs, filenames/branch patterns, scoped rules, and **manual reconciliation**; no requirement for AI yet.
- Distinguish `submitted`, `under_review`, `accepted`, `returned`, `not_applicable` and `unresolved`.
- UI: group dashboards, plan-as-of, overdue tasks, accepted GitLab tasks, MR review queue, staff explanation per metric.

**Gate:** A changed Sheet does **not** silently change existing learner percentages; one MR with two tasks and one task with multiple MRs work; GitLab MR merge alone does not imply accepted.

## Stage 4 — Managed content releases (in parallel, opt-in)

### Build

- Add versioned `content-manifest.yaml` and immutable CI build metadata to one existing repo, without moving file structure.
- Store built HTML + assets under content unit and version/hash paths, not mutable `latest/index.html`.
- Moodle plugin content resolver launches correct artifact by authenticated Moodle user, course, activity and locked plan; cache only verified lock.
- Contract with frontend interactive package: version metadata, attempt ID, submit/score, server-side validation; backward-compatible adapter for legacy plugin.
- Test one interactive v1/v2 side by side with Moodle, caching, privacy, iframe CSP and grade consistency.

**Gate:** Two different learners in same Moodle course see different locked artifacts; failed resolver does not serve unintended newer version; old plugin score sync remains stable.

## Stage 5 — Controlled migration and compatibility

### Build

- Immutable assessment compatibility matrix; release diffing; UI Migration Wizard (preview, scoring, full audit); dry-run tasks actions.
- `CARRY_OVER`, `REASSESS`, `SUPPLEMENT`, `NEW_REQUIRED`, `RETIRED`, `MANUAL_REVIEW`; old results immutable; versioned recalculations.
- Transactional revision update, idempotent request, concurrency checks; compensating rollback workflow.
- Explicit treatment of Moodle gradebook: external carried credit is **not** a real Moodle Quiz attempt. Support separate grade item/activity if necessary.

**Gate:** Migration preview exactly matches applied plan; no deleted results; repeated apply does not duplicate credit; rollback restores prior active plan with recorded audit.

## Stage 6 — AI assisted reconciliation + broader analytics

### Build

- Curated manually reviewed MR-task dataset; scoped ranking + optional LLM candidate generator; independently calibrated confidence and human gate.
- Matching rule proposals from repeat staff decisions; replay benchmark of precision/false auto-link; no automatic grading decisions.
- Skills analytics, learning pace, assessment growth, per-student explanatory profile with evidence and quality warnings; optional BI exports.

**Gate:** False positive auto-accepted links under institution-approved target, with a review sample and rollback path. No unsupported personality inference.

## Stage 7 — Optional integrations and content modernization

- Discord opt-in education-specific event signals and retention design; other Sheets/doc providers via adapter.
- New modular interactive packages; AsciiDoc custom include extension; plugin Runtime Adapter; gradual old-content migration only when changed.
- Consider LTI/xAPI if standards interoperability is valuable **after** current plugin contract is understood; no mandatory migration.

## Suggested order for Codex/GitHub visualization build

1. Build a static artifact website consuming **mock data only**, with navigable architecture, dictionary, flows, source inventory, two pilot scenario walkthroughs and lifecycle examples.
2. Build interactive version-lock, curriculum plan comparison, MR reconciliation and migration preview demos that run entirely client-side. Label everything `synthetic`.
3. Validate data schemas and examples in CI and render Mermaid diagrams.
4. Later connect read-only backend APIs. Do not connect GitHub Pages front-end directly to Moodle/GitLab tokens.

## Release acceptance: measurable checks

- 100% of manually validated test learners have explainable applicable assignments/denominators.
- No metric turns missing grades into zero unless metric policy explicitly says so.
- Repeated sync over same input yields identical source-normalized facts and no duplicated grades/evidence.
- Every admin/manual match decision has reviewer, time, scope and evidence and is reversible by superseding decision.
- Historical snapshots remain queryable after spreadsheet edits, GitLab MR changes and curriculum releases.
- No leaked student PII or service tokens to browser, repo, static site or logs.
- All exceptions (sync failures, stale data, MR ambiguity, missing Moodle attempts) are visibly labeled.
- Locked instance remains pinned through multiple releases until approved migration.

