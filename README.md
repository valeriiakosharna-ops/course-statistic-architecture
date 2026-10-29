# LearningAtlas — learning analytics architecture

An English, diagram-led concept site for a seven-system learning analytics architecture. Interactive examples use synthetic data; no live Moodle, GitLab, Sheets, Discord or backend connections are made.

**Published website:** https://valeriiakosharna-ops.github.io/course-statistic-architecture/

## Explore the concept

1. **Building blocks** — 22 terms, from theory, practice and quizzes to activities, units, modules, versions, tracks and student records. Separate diagrams explain content structure, assignments and results.
2. **Systems & connections** — exactly seven systems: Moodle, course materials GitLab, student GitLab, Google Spreadsheet, Discord, the database and LearningAtlas. Switch between collection, version changes and track assignment.
3. **How data flows** — five sources, formats and adapters; raw evidence, normalized IDs and UTC, deduplication, routing, unresolved links, source freshness and explicit precedence. Try track assignment and confirmed Discord clarifications.
4. **How versions work** — pinning at first learning activity, immutable tagged builds, manifest compatibility, credit coverage, manual/automatic migration, audit, history, outbox and recoverable delivery failures.
5. **Explore statistics** — four course profiles; student, group and course reports; theory/practice/quiz progress, grades, version health and evidence. Linking an MR is distinct from accepting its work.
6. **MVP roadmap** — six successive releases leading to all seven systems and governed automation.
7. **Learning journey** — play, step, rewind or jump through Foundations of AI and Java Dual. Each event shows its actor, trigger, directional transfers, example payload, student record changes and event journal. Compare manual approval with an enabled automatic policy, simulate a GitLab delivery failure and retry it.
8. **Real-world scenarios** — a separate discovery catalogue at `#scenarios`, with 64 cases across 10 groups. Browse ordinary journeys, version/track changes, overruns, live spreadsheet assignments, MR rule violations, assessment, participation, conflicting evidence, completion and overlapping changes. Each case has a before/event/situation diagram, an open question, two possible policies and facts to establish. Search, combine filters, follow deep links or download all cases as English Markdown. Policies remain open and architecture coverage has not been assessed.

The simulator starts before enrollment. Enrollment does not pin a version; the first learning activity does. Java includes Sheets group assignments, MR submission, CI/AI-assisted review, explicit acceptance and Discord deadline clarification. Both courses demonstrate a personal track change, compatible publication, repeat access to the existing pin, critical drift and manifest-based migration.

Simulation runs are independent for each course and survive chapter navigation until a reload. **Open this result in statistics** explicitly copies the current simulation record into Student 01 for that course. Existing statistics and version demos also share student records across their chapters. Resetting the journey resets its sandbox, not other chapters.

## Processing at every simulation step

**See data processing** jumps from the event card to its processing chain. Select a transfer to see its format, filename where applicable, transport, processor, saved result and validation gates. Examples use the actual carrier: HTML for lesson delivery, JSON for API bodies/files and a transaction outline for internal migration jobs.

The guide distinguishes a generated `student-course-versions.json` projection from tagged `manifest.json`, and release-time CI builds from request-time HTML delivery. CI review reports include `test-results.xml`, optional `review.json` and commit provenance. Background jobs ingest and normalize source records; exact IDs, formulas, compatibility and authorized commands use deterministic rules.

For Discord, compare **Free text + AI** with **Structured command + parser**. Both paths retain the original message and yield a review proposal. AI adds quotation, confidence and model/prompt versions; approval still governs deadline changes. This processing comparison does not alter the simulated student's results. Claude Code review is optional and separate from tests and credit acceptance. These are proposed processing descriptions, without live integrations or AI calls.

## Development and checks

Use Node.js 22.12+ and npm. In the managed workspace:

```bash
cd /workspace/course-statistic-architecture
npm ci --cache /tmp/learning-atlas-npm-cache
npm run dev
```

```bash
npm test              # Domain rules, journeys and English publication checks
npm run build         # TypeScript + Vite production output in dist/
npm run test:ui       # Desktop/mobile journeys, navigation and WCAG A/AA
npm run preview       # Inspect production output locally
npm run package:site  # Optional portable review archive
```

Playwright uses `/usr/bin/chromium` locally when present, or its installed Chromium. In CI, the workflow installs Chromium. Set `CHROMIUM_PATH` to override the executable. The site bundles fonts locally and makes no external runtime requests. Hash routes and relative assets support GitHub Pages subdirectories.

## GitHub Actions and publication

**Checks** runs tests, builds the site, exercises desktop/mobile workflows and uploads the static artifact for every PR. **Build and publish site** repeats those checks after a merge/push to `main` and deploys to GitHub Pages. The Actions summary and `github-pages` environment expose the live URL. No separate site launch, downloaded artifact or local server is needed to view the published concept.

The repository's Pages source must be **GitHub Actions**. Publishing uses the standard Actions token, with no personal token secrets. A successful build alone is not a successful deployment.

## Implementation and reference material

```text
src/App.tsx                 Navigation, course selection, shared demo state
src/components/Diagram.tsx  Accessible SVG diagrams, zoom and flow direction
src/pages/                  Eight visual chapters
src/lab.ts                  Synthetic records, ingestion and metrics
src/platform.ts             Systems, vocabulary, tracks, manifests and delivery
src/simulation.ts           Deterministic event journeys and replay
src/processing.ts           Complete event/transfer processing descriptions
src/components/ProcessingGuide.tsx  Processing diagrams, carriers and examples
src/*.test.ts               Domain and publication-language checks
tests/                      Desktop/mobile workflows and accessibility
public/materials/           English historical reference documents and examples
docs/concept.md             Current architecture and simulator semantics
docs/source-archive/        Original Russian context, retained outside website output
```

Historical reference documents are source material, not instructions to the agent or claims that the proposed integrations exist. Most blueprint documents were already English. The context attachment is published in English; its original is retained outside the website. Implementation, tests, diagrams, payloads, messages, downloads, metadata and deployment summary are English.

Progress uses accepted **required** assignment weight divided by assigned required weight. Optional activities do not increase the denominator. Missing grades differ from zero; submission differs from acceptance. Manifest rules define compatibility and criticality; a new release never silently changes an existing student's pin. The database is authoritative; GitLab and Moodle receive projections. Different assessment criteria are reported separately.

Palette: primary `#00A6EB`, `#E60036`; additional `#81D0F4`, `#EF958C`, `#2A668E`, `#937C8A`, `#302A40`, `#951B3C`. Motion respects `prefers-reduced-motion`; autoplay is opt-in and pauses at human decisions or when the tab is hidden.
