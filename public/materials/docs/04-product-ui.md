# 04 — UI/UX specification for visualization and future operational app

## Information architecture

1. **Architecture Explorer**: end-to-end system, interactive source flows, overlay of AI-only vs Java multi-source models, legend for planned/legacy components.
2. **Glossary**: searchable, grouped term definitions with examples and relations.
3. **Programs**: course cards, mode, source freshness, curriculum default version, number of current students, issues.
4. **Course Setup**: course and source URLs, authorization status (NO secrets in UI), discovery, field mapping, identity mapping, publication of catalog, revision policy.
5. **Curriculum & Releases**: tasks/content/assessment versions, release diff, manifest, compatibility matrix, current default for new learners.
6. **Learning Plans**: group/individual assignments, required vs optional, deadlines, weight, revision/audit, proposed sheet changes.
7. **Version Health**: expected duration, elapsed time excluding pauses, overdue, release-gap and support severity, list of learners flagged for review.
8. **Migration Wizard**: compare v1→v5, outcomes per task, carry-over/redo/new, old vs new progress, dry-run + approval + audit.
9. **Reconciliation Inbox**: MR details, evidence, top candidate tasks, one-to-many / many-to-one links, manual reviewer decisions, source revision guard.
10. **Analytics Overview**: cohorts/programs, learner drilldowns, submission/accepted split, grades, deadlines, pace, trend and data quality.
11. **Student Profile**: plan, required obligations, timeline, GitLab review iterations where applicable, skill attainment only with sufficient assessment evidence.
12. **Sync & Data Health**: connector status, retries, missing history, source coverage, stale values, conflicts and lag.

## Two pilot walkthrough modes

**AI Basics walkthrough:** learner enrolled → first meaningful start → v1 lock → v2/v3/v5 released → keep v1 content → overdue threshold → migration preview preserving compatible results. Show grade discrepancy warning where Moodle grade item cannot represent assessment-version distinction.

**Java walkthrough:** Moodle 100 catalog activities but group A required 30 and B required 35 → Sheets imports group assignments/due dates → Moodle submissions link MR → GitLab MR mismatch → human resolves several-to-several evidence links → accepted count updates; changing Sheet creates plan proposal not automatic denominator change.

## Dashboard concepts

**Program header:** students active, current default curriculum release, sync freshness, applicable completion mean, at-risk due to pace, review queue and data-health badges.

**Student row:** ID/name (synthetic), group or Self-paced, locked version, accepted/completed, submitted, score average with graded coverage, on-time eligible denominator, expected/actual pace, elapsed/expected duration, confidence/data quality and review alerts.

**Student detail:** separate tabs Overview, Assigned Plan, Assessment & Attempts, Evidence & GitLab, Progress Timeline, Skills (later), Version & Migration, Provenance. Every clickable metric explains formula, denominator, as-of, sources, version and missing data.

**Visual rules:** Accessible light/neutral UI, restrained NIX-inspired accent colors optional (#00A6EB, #E60036), no decorative charts of unverified data. Clearly badge all fixtures `DEMO`. Tooltips/empty states for not-applicable vs unknown vs zero. Use charts only where data has consistent semantics.

## GitHub static visualization UX

- Stack could be Next.js or Vite/React/TypeScript, with Mermaid for architecture and Recharts or equivalent for demo charts.
- Static Pages build uses local JSON fixtures. All controls are local interactions; buttons must be functional (filters, tabs, simulated decisions, migration preview) and must not imply production persistence.
- Include deep links/anchors to terminology and architecture decisions. Render module boundaries and stage availability.
- No external auth, Moodle tokens, GitLab tokens, actual student names, or online backend endpoints in GitHub Pages.
- Responsive layout; keyboard access; clear contrast; no animations required for comprehension.

## Key tables for the interactive demo

- Task applicability: Moodle activity count vs required per student/plan.
- Evidence reconciliation: evidence ↔ canonical assignment, status, score, source and reviewer.
- Timeline: valid date vs recorded date, learning progress and plan revision.
- Migration: old task/version, new task/version, compatibility decision, carry-over value and newly needed work.
- Source health: observed objects, mapped objects, late sync, missing attempts and conflicts.

