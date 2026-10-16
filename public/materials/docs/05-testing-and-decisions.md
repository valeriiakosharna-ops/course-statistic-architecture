# 05 — Test catalog, uncertainties, decisions and operational hazards

## Core acceptance scenarios

| ID | Scenario | Expected outcome |
|---|---|---|
| T01 | Moodle catalog 100 activities; learner assigned only 30 | Completion denominator 30 (or weighted equivalent) |
| T02 | Another group assigned 35 of same Moodle course | Its denominator 35; unaffected by group A |
| T03 | New course release after learner's start | Existing learner remains on pinned curriculum/content |
| T04 | Two start events simultaneously from tabs | Exactly one learning instance/revision created |
| T05 | Pre-enrolled but no learning activity | No first-start lock until configured meaningful event |
| T06 | Historical first-start unknown | Mark imported/inferred and review before sensitive changes |
| T07 | Old learner 240 days vs expected 30 | Over-duration alert independent from version-age severity |
| T08 | Migrating v1→v5 with compatible task | Carried credit with linked original result; audit retained |
| T09 | Migrating changed assessment | Explicit reassess/manual review; never auto fabricate Quiz attempt |
| T10 | Multiple source MRs for one Java assignment | One logical task credit, all evidence retained |
| T11 | One MR covers two tasks | Two explicit evidence links; teacher review if ambiguous |
| T12 | Merge MR without approval/grade | Submitted/reviewed only, not necessarily accepted |
| T13 | Changed Sheet row | Proposed plan change, old plan still applied |
| T14 | Sheet row disappeared after permission error | No task deletion; connector health alert |
| T15 | Quiz grade available, attempt history missing | Grade displayed, attempts `unknown`, no invented trend |
| T16 | Moodle name/email changed | Identity anchored to source system ID, mapping audited |
| T17 | Stale resolver/cached content | Previously verified exact lock or fail closed, never serve latest |
| T18 | New learner starts during release publish | One atomic stable published release; no half-built bundle |
| T19 | Two reviewers edit same case | Revision conflict rather than silent overwrite |
| T20 | Metric rule changes | Preserve previous computed version and distinguish new series |
| T21 | Replayed webhook + scheduled sync | No duplicate evidence/result |
| T22 | MR source revision changes after review | Re-evaluate dependent decision per configured policy |
| T23 | User directly edits signed iframe URL | Token/access validation rejects unauthorized artifact |
| T24 | Grade submission uses arbitrary client score | Reject or validate against authorized assessment/server rules |
| T25 | Student pauses learning | Duration excludes approved pause per explicit policy |
| T26 | Completed student re-enrolls | New learning instance, prior completion history intact |
| T27 | Migration apply repeated/retried | Idempotent new plan revision once |
| T28 | Data access by unauthorized teacher | Scoped RBAC denies student record |

## Open decisions to resolve during discovery (do not silently assume)

1. Exact Moodle and custom plugin versions, source code access and list of available endpoints.
2. Who writes plugin scores, which attempt/version metadata is currently stored, and whether grading changes can be isolated safely.
3. Existing HTML publication topology: Moodle file store vs external origin; iframe frame sandbox, CSP, third-party cookies, domain routing.
4. How to represent different assessment versions in **one Moodle course** while retaining score display, activity restrictions and gradebook compatibility.
5. Moodle activity vs canonical Task cardinalities; whether one `mod_assign` represents one or many logical tasks.
6. Current authoritative completion policy per pilot (Moodle completion, grade threshold, teacher-approved review, etc.).
7. Whether Google Sheets includes individual overrides and how deadlines/timezones are expressed.
8. How users are identified in private GitLab subgroups and whether GitLab accounts map to one learner (exceptions for teams).
9. Which program versions are still supported and who can approve migration compatibility, pauses and deadlines.
10. Course's meaningful start: explicit button, first attempt, first interactive action; how historical start is inferred.
11. Who may see granular review comments, MR links, activity timelines and cross-program data; retention limits.
12. Which metrics require plugin extension (per-attempt telemetry) and which are verifiable today.
13. Error budget/latency for synchronous version resolver and offline behavior.
14. Deployment/infrastructure restrictions (self-hosting, cloud, backups, network from Moodle).
15. Whether a learner may redo a completed course and keep previous results in a new instance.

## Policy decisions needing written approval

- Source of truth per field, applicability/required status, score acceptance policy, deadline precedence, migration compatibility threshold, student alert thresholds, human review role, grade write-back rules, data retention, access to identifiable data and audit trail.

## ADRs to create

- ADR-001: canonical registry independent of Moodle course contents.
- ADR-002: individual immutable plan snapshots and start trigger.
- ADR-003: immutable published artifacts with authenticated content resolver.
- ADR-004: grade versioning and Moodle gradebook coexistence strategy.
- ADR-005: PostgreSQL + modular monolith before microservices.
- ADR-006: Sheets are editable proposals, not historical authority.
- ADR-007: human-approved matching with evidence and no inference of completion from merge.
- ADR-008: event/raw replay and bitemporal metric versioning.
- ADR-009: privacy / Discord optional scope and safe AI usage.

## References for implementation investigation

Official APIs (current docs must be checked against the installed versions and permissions):

- Moodle external services: https://docs.moodle.org/dev/Web_services
- Moodle Web Services function inventory: https://docs.moodle.org/dev/Web_services_Roadmap
- Moodle events: https://docs.moodle.org/dev/Events_API
- GitLab merge requests API: https://docs.gitlab.com/api/merge_requests/
- GitLab webhook events: https://docs.gitlab.com/user/project/integrations/webhook_events/
- Google Sheets batchGet: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet

